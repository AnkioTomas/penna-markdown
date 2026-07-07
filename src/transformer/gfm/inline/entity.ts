/**
 * @file 行内语法：HTML 实体与数字字符引用
 * @module transformer/gfm/inline/entity
 *
 * 将 `&amp;`、`&#123;` 等实体解析为 Unicode 文本节点。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { tryParseEntity } from "@/transformer/utils/htmlEntities";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext"; // 引入你刚才完善好的转义工具

/**
 * HTML 实体行内解析器。
 * @extends {BaseInlineParser}
 */
class EntityInlineParser extends BaseInlineParser {
  constructor() {
    super("entity", false);
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    return src[index] === "&";
  }

  /** @inheritdoc */
  parse(src: string, index: number, _ctx: any) {
    const parsed = tryParseEntity(src, index);
    if (!parsed) return null;

    return {
      // 核心修复：节点的 length 必须记录源码长度（parsed.length），也就是原始实体占了几个字符。
      // 而真实的值（比如 &），则安全地存放在 value 里。
      node: createNode("text", parsed.length, parsed.value),
      nextIndex: index + parsed.length,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    return escapeHtml(node.value ?? "");
  }
}

export default new EntityInlineParser();
