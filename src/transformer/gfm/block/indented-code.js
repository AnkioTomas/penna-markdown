/**
 * @file 块级语法：缩进代码块
 * @module transformer/gfm/block/indented-code
 *
 * Indented Code Block：以 ≥4 列缩进标识的代码块。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { isIndentedCodeLine, stripCodeContent, getIndent } from "@/transformer/utils/tabs.js";

/**
 * 缩进代码块解析器。
 *
 * @extends {BaseBlockParser}
 */
class IndentedCodeBlockParser extends BaseBlockParser {
  constructor() {
    // 缩进代码块优先级较高，确保在标题等可能误匹配的语法之前运行
    // 但通过 canInterruptParagraph: false 避免它中断正常段落
    super({ type: "indented-code", priority: 110, canInterruptParagraph: false });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    let line = lines[index];
    // 使用 getIndent 兼容 tab
    if (!isIndentedCodeLine(line) || line.trim() === "") return null;

    const contentLines = [];
    let i = index;
    while (i < lines.length) {
      line = lines[i];
      const indent = getIndent(line);
      const isBlank = line.trim() === "";

      if (indent < 4 && !isBlank) break;

      // 仅空白且缩进 > 4 列的空格属于代码内容（Example 82）
      if (isBlank && indent >= 4) {
        const stripped = stripCodeContent(line);
        if (stripped !== "") {
          contentLines.push(stripped);
          i++;
          continue;
        }
      }

      // 空行（含仅 4 列缩进的空白行）：看后面是否还有缩进行
      if (isBlank) {
        let nextNonBlank = i + 1;
        while (nextNonBlank < lines.length && lines[nextNonBlank].trim() === "") {
          nextNonBlank++;
        }
        if (nextNonBlank < lines.length && isIndentedCodeLine(lines[nextNonBlank])) {
          contentLines.push("");
          i++;
          continue;
        } else {
          // 后面没有缩进行了，缩进代码块结束
          break;
        }
      }

      contentLines.push(stripCodeContent(line));
      i++;
    }

    const node = createNode(this.type, {
      content: contentLines.join("\n"),
      lang: ""
    });

    return { node, nextIndex: i };
  }

  /** @inheritdoc */
  render(node) {
    const { content } = node.props;
    return `<pre><code>${escapeHtml(content)}\n</code></pre>`;
  }
}

export default new IndentedCodeBlockParser();
