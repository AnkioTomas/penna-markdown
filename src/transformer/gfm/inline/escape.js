/**
 * @file 行内语法：反斜杠转义
 * @module transformer/gfm/inline/escape
 *
 * CommonMark 可转义 ASCII 标点字符。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

/** 可被反斜杠转义的 ASCII 标点集合 */
const ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;

/**
 * 反斜杠转义行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class EscapeInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "escape", priority: 100 });
  }

  /** @inheritdoc */
  parse(src, index) {
    if (src[index] !== "\\") return null;
    const next = src[index + 1];

    if (next === undefined) {
      return {
        node: createNode("text", { value: "\\" }),
        nextIndex: index + 1,
      };
    }

    if (ESCAPABLE.test(next)) {
      return {
        node: createNode("text", { value: next }),
        nextIndex: index + 2,
      };
    }

    return {
      node: createNode("text", { value: "\\" }),
      nextIndex: index + 1,
    };
  }

  /** @inheritdoc */
  render(node) {
    return escapeHtml(node.value);
  }
}

export default new EscapeInlineParser();
