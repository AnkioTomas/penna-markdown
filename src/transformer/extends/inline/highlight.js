/**
 * 行内语法拓展：高亮 ==text==
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { matchDelimited } from "@/transformer/gfm/inline/shared.js";

const RE = /^==(.+?)==/;

class HighlightInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "highlight", priority: 48 });
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
    return `<mark>${ctx.renderInline(node.children)}</mark>`;
  }
}

export default new HighlightInlineParser();
