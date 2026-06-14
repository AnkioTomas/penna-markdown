/**
 * @file 行内语法：反斜杠转义
 * @module transformer/gfm/inline/escape
 *
 * CommonMark 可转义 ASCII 标点字符。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
import {InlineParseContext} from "@/transformer/core/context/InlineParseContext";

/** 可被反斜杠转义的 ASCII 标点集合 */
const ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;

/**
 * 反斜杠转义行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class EscapeInlineParser extends BaseInlineParser {
  constructor() {
    super("escape");
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return src[index] === "\\";

  }

  /** @inheritdoc */
  parse(src: string, index: number) {
    const next = src[index + 1];

    if (next === undefined) {
      return {
        node: createNode("text", 2, "\\"),
        nextIndex: index + 1,
      };
    }

    if (ESCAPABLE.test(next)) {
      return {
        node: createNode("text", next.length + 1, next),
        nextIndex: index + 2,
      };
    }

    return {
      node: createNode("text", 1, "\\"),
      nextIndex: index + 1,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    return escapeHtml(node.value??'');
  }
}

export default new EscapeInlineParser();
