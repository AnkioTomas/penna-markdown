/**
 * 行内语法：加粗 **text** 或 __text__（由 delimiters.js 解析，此处仅渲染）
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";

class StrongInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "strong", priority: 40 });
  }

  parse() {
    return null;
  }

  render(node, ctx) {
    return `<strong>${ctx.renderInline(node.children)}</strong>`;
  }
}

export default new StrongInlineParser();
