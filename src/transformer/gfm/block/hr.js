/**
 * @file 块级语法：分割线 (Thematic Break)
 * @module transformer/gfm/block/hr
 *
 * CommonMark / GFM 水平分割线：`---`、`* * *`、`___` 等。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

/**
 * GFM thematic break：0–3 列缩进，同一字符 (-、*、_) 重复 ≥3 次，中间可有空格或 tab。
 *
 * @param {string} line
 * @returns {boolean}
 */
export function isThematicBreakLine(line) {
  return /^( {0,3})([-*_])([ \t]*\2){2,}[ \t]*$/.test(line ?? "");
}

/**
 * 水平分割线块解析器。
 *
 * @extends {BaseBlockParser}
 */
class ThematicBreakParser extends BaseBlockParser {
  constructor() {
    super({ type: "hr", priority: 95 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    if (!isThematicBreakLine(line)) return null;

    const node = createNode(this.type);
    return { node, nextIndex: index + 1 };
  }

  /** @inheritdoc */
  render(node, ctx) {
    return "<hr />";
  }
}

export default new ThematicBreakParser();
