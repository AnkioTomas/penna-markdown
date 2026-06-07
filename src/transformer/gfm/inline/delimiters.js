/**
 * CommonMark 强调 / 加粗定界符栈（scanDelims + processEmphasis）
 * 栈帧由引擎 store 管理，本模块通过 inlineFinalizer 注册后处理
 */

import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

const reUnicodeWhitespaceChar = /^\s/u;
const rePunctuation = /^[!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~\p{P}\p{S}]/u;

function previousChar(str, pos) {
  if (pos === 0) return "\n";
  if (pos >= 2 && str.charCodeAt(pos - 2) >= 0xd800 && str.charCodeAt(pos - 2) <= 0xdbff) {
    return str.slice(pos - 2, pos);
  }
  return str[pos - 1];
}

/** @returns {{ numDelims: number, canOpen: boolean, canClose: boolean, char: string } | null} */
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

function removeDelimiter(entry) {
  if (entry.prev) entry.prev.next = entry.next;
  if (entry.next) entry.next.prev = entry.prev;
}

function removeDelimitersBetween(bottom, top) {
  if (bottom.next !== top) {
    bottom.next = top;
    top.prev = bottom;
  }
}

function findNodeIndex(nodes, node) {
  return nodes.indexOf(node);
}

function removeEmptyDelimNode(nodes, node) {
  if (node?.type === "text" && node.props?.noMerge && node.value === "") {
    const idx = nodes.indexOf(node);
    if (idx !== -1) nodes.splice(idx, 1);
  }
}

/** @returns {DelimiterState} */
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

/** @param {Record<string, unknown>} frame */
function getDelimiterState(frame) {
  if (!frame.delimiters) {
    frame.delimiters = createDelimiterState();
  }
  return /** @type {DelimiterState} */ (frame.delimiters);
}

/**
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

    const emphNode = createNode(type, { children });

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
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes
 * @param {Record<string, unknown>} frame
 */
export function emphasisInlineFinalizer(nodes, frame) {
  const state = frame.delimiters;
  if (!state) return nodes;

  processEmphasis(nodes, state.stackBottom);
  literalizeRemainingDelims(nodes);
  delete frame.delimiters;
  return nodes;
}

/**
 * @param {string} src
 * @param {number} index
 * @param {import('@/transformer/core/ParserContext.js').InlineParseContext} ctx
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
