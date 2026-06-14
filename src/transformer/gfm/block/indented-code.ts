/**
 * @file 块级语法：缩进代码块
 * @module transformer/gfm/block/indented-code
 *
 * Indented Code Block：以 ≥4 列缩进（空格或 Tab）标识的代码块。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { isBlankString } from "@/transformer/utils/normalize";
import { isIndentedCodeLine, stripVisualIndent } from "@/transformer/utils/tabs.js";

function parseIndentedLine(line: string): { isCode: boolean; isBlank: boolean; content: string } {
  const isBlank = isBlankString(line);
  if (isIndentedCodeLine(line)) {
    return { isCode: true, isBlank, content: stripVisualIndent(line) };
  }
  return { isCode: false, isBlank, content: "" };
}

class IndentedCodeBlockParser extends BaseBlockParser {
  constructor() {
    super("indented-code");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    const line = lines[index] ?? "";

    if (index > 0 && !isBlankString(lines[index - 1] ?? "")) {
      return false;
    }

    const info = parseIndentedLine(line);
    if (info.isBlank) {
      return false;
    }

    return info.isCode;
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    if (!this.canOpenAt(lines, index, ctx)) return null;

    const contentLines: string[] = [];
    let length = 0;
    let i = index;

    let pendingBlankLines: string[] = [];
    let pendingLength = 0;

    while (i < lines.length) {
      const line = lines[i];
      const info = parseIndentedLine(line);

      if (info.isCode) {
        if (pendingBlankLines.length > 0) {
          contentLines.push(...pendingBlankLines);
          length += pendingLength;
          pendingBlankLines = [];
          pendingLength = 0;
        }

        contentLines.push(info.content);
        length += line.length;
        i += 1;
      } else if (info.isBlank) {
        pendingBlankLines.push("");
        pendingLength += line.length;
        i += 1;
      } else {
        break;
      }
    }

    i -= pendingBlankLines.length;

    const node = createNode(this.type, length, undefined, [], {
      content: contentLines.join("\n"),
      lang: "",
    });

    return { node, nextIndex: i };
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    const content = (node.props?.content as string) || "";
    return `<pre><code>${escapeHtml(content)}\n</code></pre>`;
  }
}

export default new IndentedCodeBlockParser();
