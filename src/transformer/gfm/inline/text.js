/**
 * 行内语法：纯文本兜底（priority 最低）
 */

import { escapeHtml } from "@/transformer/utils/escape.js";
import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

class TextInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "text", priority: -1000 });
  }

  parse(src, index, ctx) {
    if (index >= src.length) return null;

    return {
      node: createNode("text", { value: src[index] }),
      nextIndex: index + 1,
    };
  }

  render(node) {
    return escapeHtml(node.value);
  }
}

export default new TextInlineParser();
