/**
 * 行内语法：删除线 ~~text~~
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { matchDelimited } from "@/transformer/gfm/inline/shared.js";

const RE = /^~~(.+?)~~/;

class StrikethroughInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "strikethrough", priority: 50 });
  }

  parse(src, index, ctx) {
    const m = matchDelimited(src, index, RE);
    if (!m) return null;
    return {
      node: createNode(this.type, { children: ctx.parseInline(m.inner) }),
      nextIndex: index + m.length,
    };
  }

  render(node, ctx) {
    return `<del>${ctx.renderInline(node.children)}</del>`;
  }
}

export default new StrikethroughInlineParser();
