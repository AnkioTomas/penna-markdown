/**
 * @file 行内高亮语法
 * @module transformer/extends/inline/highlight
 *
 * 语法：`==text==`，渲染为 `<mark>` 元素。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { matchDelimited } from "@/transformer/gfm/inline/shared.js";

/** 高亮定界符正则 */
const RE = /^==(.+?)==/;

/**
 * 行内高亮解析器。
 *
 * @extends {BaseInlineParser}
 */
class HighlightInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "highlight", priority: 48 });
  }

  /** @inheritdoc */
  parse(src, index, ctx) {
    const m = matchDelimited(src, index, RE);
    if (!m) return null;
    return {
      node: createNode(this.type, { children: ctx.parseInline(m.inner) }),
      nextIndex: index + m.length,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    return `<mark>${ctx.renderInline(node.children)}</mark>`;
  }
}

export default new HighlightInlineParser();
