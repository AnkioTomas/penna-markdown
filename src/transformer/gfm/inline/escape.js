/**
 * 行内语法：反斜杠转义
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

const ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;

class EscapeInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "escape", priority: 100 });
  }

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

  render(node) {
    return escapeHtml(node.value);
  }
}

export default new EscapeInlineParser();
