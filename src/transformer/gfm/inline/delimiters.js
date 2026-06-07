/**
 * @file CommonMark 强调 / 加粗定界符栈
 * @module transformer/gfm/inline/delimiters
 *
 * scanDelims + processEmphasis 实现 CommonMark Rule 12–14。
 * 栈帧由引擎 store 管理，本模块通过 inlineFinalizer 注册后处理。
 */

import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

/** Unicode 空白字符检测 */
const reUnicodeWhitespaceChar = /^\s/u;

/** Unicode 标点 / 符号检测 */
const rePunctuation = /^[!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~\p{P}\p{S}]/u;

/**
 * 获取 index 前一个字符（正确处理 surrogate pair）。
 *
 * @param {string} str
 * @param {number} pos
 * @returns {string}
 */
function previousChar(str, pos) {
  if (pos === 0) return "\n";
  if (pos >= 2 && str.charCodeAt(pos - 2) >= 0xd800 && str.charCodeAt(pos - 2) <= 0xdbff) {
    return str.slice(pos - 2, pos);
  }
  return str[pos - 1];
}

/**
 * CommonMark scanDelims：扫描 `*` / `_` 定界符并判断 canOpen / canClose。
 *
 * @param {string} src
 * @param {number} pos
 * @returns {{ numDelims: number, canOpen: boolean, canClose: boolean, char: string } | null}
 */
export function scanDelims(src, pos) {
  const cc = src[pos];
  if (cc !== "*" && cc !== "_") return null;

  let numDelims = 0;
  const startpos = pos;
  while (pos + numDelims < src.length && src[pos + numDelims] === cc) {
    numDelims += 1;
  }

  const charBefore = previousChar(src, startpos);
  const charAfter = startpos + numDelims >= src.length ? "\n" : src[startpos + numDelims];

  const afterIsWhitespace = reUnicodeWhitespaceChar.test(charAfter);
  const afterIsPunctuation = rePunctuation.test(charAfter);
  const beforeIsWhitespace = reUnicodeWhitespaceChar.test(charBefore);
  const beforeIsPunctuation = rePunctuation.test(charBefore);

  const leftFlanking =
    !afterIsWhitespace &&
    (!afterIsPunctuation || beforeIsWhitespace || beforeIsPunctuation);
  const rightFlanking =
    !beforeIsWhitespace &&
    (!beforeIsPunctuation || afterIsWhitespace || afterIsPunctuation);

  let canOpen;
  let canClose;
  if (cc === "_") {
    canOpen = leftFlanking && (!rightFlanking || beforeIsPunctuation);
    canClose = rightFlanking && (!leftFlanking || afterIsPunctuation);
  } else {
    canOpen = leftFlanking;
    canClose = rightFlanking;
  }

  return { numDelims, canOpen, canClose, char: cc };
}

/**
 * @typedef {Object} DelimiterEntry
 * @property {string} char
 * @property {number} numDelims
 * @property {number} origDelims
 * @property {import('@/transformer/core/MarkdownNode.js').MarkdownNode} node
 * @property {boolean} canOpen
 * @property {boolean} canClose
 * @property {DelimiterEntry | null} prev
 * @property {DelimiterEntry | null} next
 */

/** @typedef {{ stackBottom: DelimiterEntry, stack: DelimiterEntry | null }} DelimiterState */

/**
 * 从双向链表中移除定界符条目。
 *
 * @param {DelimiterEntry} entry
 */
function removeDelimiter(entry) {
  if (entry.prev) entry.prev.next = entry.next;
  if (entry.next) entry.next.prev = entry.prev;
}

/**
 * 压缩 bottom 与 top 之间的未匹配定界符。
 *
 * @param {DelimiterEntry} bottom
 * @param {DelimiterEntry} top
 */
function removeDelimitersBetween(bottom, top) {
  if (bottom.next !== top) {
    bottom.next = top;
    top.prev = bottom;
  }
}

/**
 * 查找节点在数组中的索引。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} node
 * @returns {number}
 */
function findNodeIndex(nodes, node) {
  return nodes.indexOf(node);
}

/**
 * 移除空的定界符占位 text 节点。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} node
 */
function removeEmptyDelimNode(nodes, node) {
  if (node?.type === "text" && node.props?.noMerge && node.value === "") {
    const idx = nodes.indexOf(node);
    if (idx !== -1) nodes.splice(idx, 1);
  }
}

/**
 * 创建空定界符栈状态。
 *
 * @returns {DelimiterState}
 */
function createDelimiterState() {
  const stackBottom = {
    char: "",
    numDelims: 0,
    origDelims: 0,
    node: null,
    canOpen: false,
    canClose: false,
    prev: null,
    next: null,
  };
  return { stackBottom, stack: null };
}

/**
 * 从 inline 栈帧获取或初始化定界符状态。
 *
 * @param {Record<string, unknown>} frame
 * @returns {DelimiterState}
 */
function getDelimiterState(frame) {
  if (!frame.delimiters) {
    frame.delimiters = createDelimiterState();
  }
  return /** @type {DelimiterState} */ (frame.delimiters);
}

/**
 * 处理定界符栈，将匹配的 emphasis/strong 节点插入 AST。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes
 * @param {DelimiterEntry | null} stackBottom
 */
export function processEmphasis(nodes, stackBottom) {
  const openersBottom = new Array(14).fill(stackBottom);

  let closer = stackBottom.next;
  while (closer) {
    if (!closer.canClose) {
      closer = closer.next;
      continue;
    }

    let openersBottomIndex;
    if (closer.char === "_") {
      openersBottomIndex = 2 + (closer.canOpen ? 3 : 0) + (closer.origDelims % 3);
    } else {
      openersBottomIndex = 8 + (closer.canOpen ? 3 : 0) + (closer.origDelims % 3);
    }

    let opener = closer.prev;
    let openerFound = false;
    while (opener && opener !== stackBottom && opener !== openersBottom[openersBottomIndex]) {
      const oddMatch =
        (closer.canOpen || opener.canClose) &&
        closer.origDelims % 3 !== 0 &&
        (opener.origDelims + closer.origDelims) % 3 === 0;
      if (opener.char === closer.char && opener.canOpen && !oddMatch) {
        openerFound = true;
        break;
      }
      opener = opener.prev;
    }

    const oldCloser = closer;

    if (!openerFound) {
      openersBottom[openersBottomIndex] = oldCloser.prev;
      if (!oldCloser.canOpen) {
        removeDelimiter(oldCloser);
      }
      closer = closer.next;
      continue;
    }

    const matched = Math.min(opener.numDelims, closer.numDelims);
    let useDelims;
    if (matched >= 2) {
      if (opener.numDelims === closer.numDelims && matched >= 3) {
        useDelims = matched % 2 === 0 ? matched : matched - 1;
      } else {
        useDelims = 2;
      }
    } else {
      useDelims = 1;
    }
    const type = useDelims === 1 ? "emphasis" : "strong";

    opener.numDelims -= useDelims;
    closer.numDelims -= useDelims;
    opener.node.value = opener.node.value.slice(0, opener.node.value.length - useDelims);
    closer.node.value = closer.node.value.slice(useDelims);

    const openerIdx = findNodeIndex(nodes, opener.node);
    const closerIdx = findNodeIndex(nodes, closer.node);
    const children = nodes.slice(openerIdx + 1, closerIdx);

    const emphNode = createNode(type, { children, delimChar: opener.char });

    const replacement = [];
    if (opener.node.value) replacement.push(opener.node);
    replacement.push(emphNode);
    if (closer.node.value) replacement.push(closer.node);

    nodes.splice(openerIdx, closerIdx - openerIdx + 1, ...replacement);

    removeDelimitersBetween(opener, closer);

    if (opener.numDelims === 0) {
      removeEmptyDelimNode(nodes, opener.node);
      removeDelimiter(opener);
    }
    if (closer.numDelims === 0) {
      removeEmptyDelimNode(nodes, closer.node);
      const next = closer.next;
      removeDelimiter(closer);
      closer = next;
    }
  }

  let d = stackBottom?.next ?? null;
  while (d && d !== stackBottom) {
    const next = d.next;
    removeDelimiter(d);
    d = next;
  }
}

/**
 * 将剩余未匹配定界符 text 节点的 noMerge 标记清除。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes
 */
function literalizeRemainingDelims(nodes) {
  for (const node of nodes) {
    if (node.type === "text" && node.props?.noMerge) {
      delete node.props.noMerge;
    }
    if (node.children?.length) {
      literalizeRemainingDelims(node.children);
    }
  }
}

/**
 * 同分隔符的 strong 嵌套合并为单层（Rule 10 / Example 398、434–436）。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} children
 * @param {string} delimChar
 * @returns {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]}
 */
function collapseSameStrongChildren(children, delimChar) {
  const out = [];
  for (const child of children) {
    if (child.type === "strong" && child.props?.delimChar === delimChar) {
      out.push(...collapseSameStrongChildren(child.children ?? [], delimChar));
      continue;
    }
    if (child.children?.length) {
      flattenSameDelimiterStrong(child.children);
      if (child.type === "strong" && child.props?.delimChar) {
        child.children = collapseSameStrongChildren(
          child.children,
          child.props.delimChar,
        );
      }
    }
    out.push(child);
  }
  return out;
}

/**
 * 递归扁平化同分隔符 strong 嵌套。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes
 */
function flattenSameDelimiterStrong(nodes) {
  for (const node of nodes) {
    if (!node.children?.length) continue;
    flattenSameDelimiterStrong(node.children);
    if (node.type === "strong" && node.props?.delimChar) {
      node.children = collapseSameStrongChildren(
        node.children,
        node.props.delimChar,
      );
    }
  }
}

/**
 * 行内解析 finalizer：处理定界符栈并清理 frame。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes
 * @param {Record<string, unknown>} frame
 * @returns {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]}
 */
export function emphasisInlineFinalizer(nodes, frame) {
  const state = frame.delimiters;
  if (!state) return nodes;

  processEmphasis(nodes, state.stackBottom);
  flattenSameDelimiterStrong(nodes);
  literalizeRemainingDelims(nodes);
  delete frame.delimiters;
  return nodes;
}

/**
 * 解析 emphasis/strong 定界符并入栈（供 EmphasisInlineParser 调用）。
 *
 * @param {string} src
 * @param {number} index
 * @param {import('@/transformer/core/ParserContext.js').InlineParseContext} ctx
 * @returns {{ node: import('@/transformer/core/MarkdownNode.js').MarkdownNode, nextIndex: number } | null}
 */
export function parseEmphasisDelim(src, index, ctx) {
  const frame = ctx.store.currentInlineFrame();
  if (!frame) return null;

  const info = scanDelims(src, index);
  if (!info) return null;

  const { numDelims, canOpen, canClose, char } = info;
  const delimState = getDelimiterState(frame);
  const node = createNode("text", {
    value: src.slice(index, index + numDelims),
    noMerge: true,
  });

  if (canOpen || canClose) {
    const entry = {
      char,
      numDelims,
      origDelims: numDelims,
      node,
      canOpen,
      canClose,
      prev: delimState.stack,
      next: null,
    };
    if (delimState.stack) delimState.stack.next = entry;
    else delimState.stackBottom.next = entry;
    delimState.stack = entry;
  }

  return { node, nextIndex: index + numDelims };
}
