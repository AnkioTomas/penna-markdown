/**
 * @file 行内语法：HTML 实体与数字字符引用
 * @module transformer/gfm/inline/entity
 *
 * 将 `&amp;`、`&#123;` 等实体解析为 Unicode 文本节点。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeText } from "@/transformer/utils/escape.js";
import { tryParseEntity } from "@/transformer/utils/htmlEntities.js";

/**
 * HTML 实体行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class EntityInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "entity", priority: 88 });
  }

  /** @inheritdoc */
  parse(src, index) {
    const parsed = tryParseEntity(src, index);
    if (!parsed) return null;

    return {
      node: createNode("text", { value: parsed.value }),
      nextIndex: index + parsed.length,
    };
  }

  /** @inheritdoc */
  render(node) {
    return escapeText(node.value);
  }
}

export default new EntityInlineParser();
