/**
 * @file 行内高亮语法
 * @module transformer/extends/inline/highlight
 *
 * 语法：`==text==`，渲染为 `<mark>` 元素。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";

/** 高亮定界符正则 */
const RE = /^==([\s\S]+?)==/;

/**
 * 行内高亮解析器。
 *
 * @extends {BaseInlineParser}
 */
class HighlightInlineParser extends BaseInlineParser {
  constructor() {
    super("highlight");
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return !(src[index] !== "=" || src[index + 1] !== "=");

  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    const match = src.slice(index).match(RE);
    if (!match) return null;

    return {
      node: createNode(this.type, match[0].length, undefined, ctx.parseInline(match[1])),
      nextIndex: index + match[0].length,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    return `<mark class="cherry-mark">${ctx.renderInline(node.children)}</mark>`;
  }
}

export default new HighlightInlineParser();