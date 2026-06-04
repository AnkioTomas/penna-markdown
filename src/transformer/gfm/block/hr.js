/**
 * 块级语法：分割线 (Thematic Break)
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

class ThematicBreakParser extends BaseBlockParser {
  constructor() {
    super({ type: "hr", priority: 95 });
  }

  parse(lines, index,blockParser) {
    const line = lines[index] ?? "";
    // 匹配 0-3 个空格，紧接着是 - * 或 _，重复至少 3 次，中间可以有空格或 tab
    const m = line.match(/^( {0,3})([-*_])([ \t]*\2){2,}[ \t]*$/);
    if (!m) return null;

    const node = createNode(this.type);
    return { node, nextIndex: index + 1 };
  }

  render(node,renderInline,renderBlock) {
    return "<hr />";
  }
}

export default new ThematicBreakParser();
