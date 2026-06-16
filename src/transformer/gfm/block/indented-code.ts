/**
 * @file 块级语法：缩进代码块
 * @module transformer/gfm/block/indented-code
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { isBlankString } from "@/transformer/utils/normalize";
import {
  CODE_INDENT,
  getIndent,
  isIndentedCodeLine,
  stripCodeContent,
  stripVisualIndent,
} from "@/transformer/utils/tabs.js";

class IndentedCodeBlockParser extends BaseBlockParser {
  constructor() {
    super("indented-code");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, ctx: BlockParseContext): boolean {
    const line = lines[index] ?? "";
    if (!isIndentedCodeLine(line) || isBlankString(line)) return false;

    const prev = lines[index - 1] ?? "";
    if (index > 0 && !isBlankString(prev) && !ctx.canStrongBreak(lines, index - 1)) {
      return false;
    }
    return true;
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    if (!this.canOpenAt(lines, index, ctx)) return null;

    const contentLines: string[] = [];
    let length = 0;
    let i = index;
    let pending = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (isIndentedCodeLine(line)) {
        // GFM Example 87：恰好 4 列的空白行只是 chunk 分界，不计入内容
        if (isBlankString(line) && getIndent(line) === CODE_INDENT) {
          length += line.length;
          i += 1;
          continue;
        }

        while (pending > 0) {
          contentLines.push("");
          pending -= 1;
        }

        contentLines.push(isBlankString(line) ? stripVisualIndent(line) : stripCodeContent(line));
        length += line.length;
        i += 1;
        continue;
      }

      if (isBlankString(line)) {
        length += line.length;
        pending += 1;
        i += 1;
        continue;
      }

      break;
    }

    i -= pending;

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
