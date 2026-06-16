/**
 * @file 行内语法：加粗（渲染）
 * @module transformer/gfm/inline/strong
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { MarkdownNode } from "@/transformer/core/MarkdownNode.js";

class StrongInlineParser extends BaseInlineParser {
  constructor() {
    super("strong", false);
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: { renderInline(nodes?: MarkdownNode[]): string }) {
    return `<strong>${ctx.renderInline(node.children)}</strong>`;
  }
}

export default new StrongInlineParser();
