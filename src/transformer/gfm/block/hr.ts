/**
 * @file 块级语法：分割线 (Thematic Break)
 * @module transformer/gfm/block/hr
 *
 * CommonMark / GFM 水平分割线：`---`、`* * *`、`___` 等。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
import {BlockParseContext} from "@/transformer/core/context/BlockParseContext";
import {RenderContext} from "@/transformer/core/context/RenderContext";

/**
 * GFM thematic break：0–3 列缩进，同一字符 (-、*、_) 重复 ≥3 次，中间可有空格或 tab。
 *
 * @param {string} line
 * @returns {boolean}
 */
export function isThematicBreakLine(line: string): boolean {
  return /^( {0,3})([-*_])([ \t]*\2){2,}[ \t]*$/.test(line ?? "");
}

/**
 * 水平分割线块解析器。
 *
 * @extends {BaseBlockParser}
 */
class ThematicBreakParser extends BaseBlockParser {
  constructor() {
    super("hr");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number): boolean {
    return isThematicBreakLine(lines[index] ?? "");
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    if (!isThematicBreakLine(line)) return null;

    const node = createNode(this.type, 1);
    return {node, nextIndex: index + 1};
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext | undefined) {
    return "<hr />";
  }
}

export default new ThematicBreakParser();
