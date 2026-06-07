/**
 * 行内语法：HTML 实体与数字字符引用
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeText } from "@/transformer/utils/escape.js";
import { tryParseEntity } from "@/transformer/utils/htmlEntities.js";

class EntityInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "entity", priority: 88 });
  }

  parse(src, index) {
    const parsed = tryParseEntity(src, index);
    if (!parsed) return null;

    return {
      node: createNode("text", { value: parsed.value }),
      nextIndex: index + parsed.length,
    };
  }

  render(node) {
    return escapeText(node.value);
  }
}

export default new EntityInlineParser();
