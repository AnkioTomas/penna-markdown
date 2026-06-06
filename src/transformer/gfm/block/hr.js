/**
 * 块级语法：分割线 (Thematic Break)
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

/** GFM thematic break：0–3 列缩进，同一字符 (-、*、_) 重复 ≥3 次，中间可有空格或 tab */
export function isThematicBreakLine(line) {
  return /^( {0,3})([-*_])([ \t]*\2){2,}[ \t]*$/.test(line ?? "");
}

class ThematicBreakParser extends BaseBlockParser {
  constructor() {
    super({ type: "hr", priority: 95 });
  }

  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    if (!isThematicBreakLine(line)) return null;

    const node = createNode(this.type);
    return { node, nextIndex: index + 1 };
  }

  render(node, ctx) {
    return "<hr />";
  }
}

export default new ThematicBreakParser();
