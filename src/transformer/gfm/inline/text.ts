/**
 * @file 行内语法：纯文本兜底
 * @module transformer/gfm/inline/text
 *
 * priority 最低，逐字符消费未被其他行内语法匹配的输入。
 */

import { escapeText } from "@/transformer/utils/escape.js";
import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
import {InlineParseContext} from "@/transformer/core/context/InlineParseContext";

/**
 * 纯文本行内解析器（兜底）。
 *
 * @extends {BaseInlineParser}
 */
class TextInlineParser extends BaseInlineParser {
  constructor() {
    super("text");
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    if (index >= src.length) return null;
    return {
      node: createNode(this.type, 1, src[index]),
      nextIndex: index + 1,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    return escapeText(node.value ?? "");
  }
}

export default new TextInlineParser();
