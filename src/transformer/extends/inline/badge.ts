/**
 * @file 行内 Badge 语法
 * @module transformer/extends/inline/badge
 *
 * 语法：`[文本]{.variant .top}`，花括号属性由 `html_attrs` 扩展解析并折叠。
 * 必须带 `{...}` 后缀才成立；裸 `[文本]` 交还给 GFM 链接/引用，避免抢占。
 *
 * 变体类名与 alert 语义一致（warning、tip、important 等）；
 * 位置类名：`top` / `bottom`，默认 middle。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
import {escapeHtml} from "@/transformer/utils/escape.js";
import {InlineParseContext} from "@/transformer/core/context/InlineParseContext.js";
import {RenderContext} from "@/transformer/core/context/RenderContext";

/** `[content]`，不含 `[[` 与链接后缀 */
const BADGE_RE = /^\[([^\]\n]+)\]/;

/**
 * 行内 Badge 解析器。
 *
 * @extends {BaseInlineParser}
 */
class BadgeInlineParser extends BaseInlineParser {
  constructor() {
    super("badge");
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return src[index] === "[" && src[index + 1] !== "[";
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    const match = src.slice(index).match(BADGE_RE);
    if (!match) return null;

    const content = match[1];
    if (content.startsWith("^")) return null;

    const nextIndex = index + match[0].length;

    // badge 必须带 `{...}` 属性后缀；裸 `[text]` 交还给 GFM 链接/引用
    if (src[nextIndex] !== "{") return null;

    return {
      node: createNode(this.type, match[0].length, content,),
      nextIndex,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    return `<span class="cherry-badge">${escapeHtml(node.value ?? "")}</span>`;
  }
}

export default new BadgeInlineParser();