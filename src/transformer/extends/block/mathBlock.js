/**
 * 块级数学公式：$$ ... $$（Cherry 语法）
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { renderMathBlock } from "@/transformer/extends/utils/cherryApi.js";

const MATH_OPEN_RE = /^( {0,3})\$\$(?!\$)\s*(.*)$/;

function stripClosingMath(line) {
  const match = line.match(/^(.*?)\s*\$\$\s*$/);
  if (!match || !line.includes("$$")) return null;
  return match[1];
}

class MathBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "math_block", priority: 105 });
  }

  parse(lines, index) {
    const line = lines[index] ?? "";
    const open = line.match(MATH_OPEN_RE);
    if (!open) return null;

    const tail = open[2];
    const sameLine = stripClosingMath(tail);
    if (sameLine !== null && (sameLine.length > 0 || tail.trim() !== "$$")) {
      const node = createNode(this.type, { content: sameLine });
      return { node, nextIndex: index + 1 };
    }

    const contentLines = [];
    if (tail.trim()) contentLines.push(tail);

    let i = index + 1;
    while (i < lines.length) {
      const ln = lines[i];
      if (/^\s*\$\$\s*$/.test(ln)) {
        const node = createNode(this.type, {
          content: contentLines.join("\n"),
        });
        return { node, nextIndex: i + 1 };
      }

      const partial = stripClosingMath(ln);
      if (partial !== null) {
        if (partial) contentLines.push(partial);
        const node = createNode(this.type, {
          content: contentLines.join("\n"),
        });
        return { node, nextIndex: i + 1 };
      }

      contentLines.push(ln);
      i += 1;
    }

    return null;
  }

  render(node) {
    return renderMathBlock(node.props.content ?? "");
  }
}

export default new MathBlockParser();
export { renderMathBlock };
