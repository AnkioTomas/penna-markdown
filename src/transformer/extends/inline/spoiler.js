/**
 * @file 行内剧透语法
 * @module transformer/extends/inline/spoiler
 *
 * 语法：`!! 文字 !!`（开闭定界符后均须有空格）
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import { isWhitespace } from "@/transformer/utils/normalize.js";

/** 开定界符长度：`!!` + 必需空白 */
const OPEN_LEN = 3;


/**
 * 从 contentStart 起查找剧透闭合定界符 ` !!` 的起始索引。
 *
 * @param {string} src
 * @param {number} contentStart - 内容起始索引
 * @returns {number} 闭合空白字符的索引，未找到返回 -1
 */
function findSpoilerClose(src, contentStart) {
  for (let i = contentStart; i < src.length - 2; i++) {
    if (!isWhitespace(src[i])) continue;
    if (src[i + 1] !== "!" || src[i + 2] !== "!") continue;
    if (isEscaped(src, i + 1)) continue;
    return i;
  }
  return -1;
}

/**
 * 行内剧透解析器。
 *
 * @extends {BaseInlineParser}
 */
class SpoilerInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "spoiler", priority: 49 });
  }

  /** @inheritdoc */
  parse(src, index, ctx) {
    if (src[index] !== "!" || src[index + 1] !== "!") return null;
    if (isEscaped(src, index)) return null;
    if (!isWhitespace(src[index + 2])) return null;

    const contentStart = index + OPEN_LEN;
    const closeStart = findSpoilerClose(src, contentStart);
    if (closeStart === -1) return null;

    const inner = src.slice(contentStart, closeStart);
    if (inner.length === 0) return null;

    return {
      node: createNode(this.type, { children: ctx.parseInline(inner) }),
      nextIndex: closeStart + 3,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    return `<span class="cherry-spoiler">${ctx.renderInline(node.children)}</span>`;
  }
}

export default new SpoilerInlineParser();
