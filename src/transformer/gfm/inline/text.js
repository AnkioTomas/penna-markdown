/**
 * @file 行内语法：纯文本兜底
 * @module transformer/gfm/inline/text
 *
 * priority 最低，逐字符消费未被其他行内语法匹配的输入。
 */

import { escapeAngleBrackets, escapeText } from "@/transformer/utils/escape.js";
import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

/**
 * 纯文本行内解析器（兜底）。
 *
 * @extends {BaseInlineParser}
 */
class TextInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "text", priority: -1000 });
  }

  /** @inheritdoc */
  parse(src, index, ctx) {
    if (index >= src.length) return null;

    return {
      node: createNode("text", { value: src[index] }),
      nextIndex: index + 1,
    };
  }

  /** @inheritdoc */
  render(node) {
    if (node.props?.bracketLiteral) {
      return escapeAngleBrackets(node.value);
    }
    return escapeText(node.value);
  }
}

export default new TextInlineParser();
