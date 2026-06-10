/**
 * @file 行内 Badge 语法
 * @module transformer/extends/inline/badge
 *
 * 语法：`[文本]{.variant .top}`，花括号属性由 `html_attrs` 扩展解析并折叠。
 *
 * 变体类名与 alert 语义一致（warning、tip、important 等）；
 * 位置类名：`top` / `bottom`，默认 middle。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

/** `[content]`，不含 `[[` 与链接后缀 */
const BADGE_RE = /^\[([^\]\n]+)\]/;

/**
 * 行内 Badge 解析器。
 *
 * @extends {BaseInlineParser}
 */
class BadgeInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "badge", priority: 209 });
  }

  /** @inheritdoc */
  parse(src, index) {
    if (src[index] !== "[" || src[index + 1] === "[") return null;
    if (isEscaped(src, index)) return null;

    const match = src.slice(index).match(BADGE_RE);
    if (!match) return null;

    const nextIndex = index + match[0].length;
    const next = src[nextIndex];

    // 不与链接、引用链接抢占
    if (next === "(" || next === "[") return null;
    if (match[1].startsWith("^")) return null;
    return {
      node: createNode(this.type, { text: match[1] }),
      nextIndex,
    };
  }

  /** @inheritdoc */
  render(node) {
    return `<span class="badge">${escapeHtml(node.text)}</span>`;
  }
}

export default new BadgeInlineParser();
