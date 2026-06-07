/**
 * @file 行内语法：删除线
 * @module transformer/gfm/inline/strikethrough
 *
 * GFM 删除线：~~text~~。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { matchDelimited } from "@/transformer/gfm/inline/shared.js";

/** 删除线定界符匹配正则 */
const RE = /^~~(.+?)~~/;

/**
 * 删除线行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class StrikethroughInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "strikethrough", priority: 50 });
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
    return `<del>${ctx.renderInline(node.children)}</del>`;
  }
}

export default new StrikethroughInlineParser();
