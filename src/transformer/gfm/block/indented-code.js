/**
 * 块级语法：缩进代码块 (Indented Code Block)
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { isIndentedCodeLine, stripCodeContent, getIndent } from "@/transformer/utils/tabs.js";

class IndentedCodeBlockParser extends BaseBlockParser {
  constructor() {
    // 缩进代码块优先级较高，确保在标题等可能误匹配的语法之前运行
    // 但通过 canInterruptParagraph: false 避免它中断正常段落
    super({ type: "indented-code", priority: 110, canInterruptParagraph: false });
  }

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

      // 如果是空行，需要看后面是否还有缩进行，如果有则保留该空行
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

  render(node) {
    const { content } = node.props;
    return `<pre><code>${escapeHtml(content)}\n</code></pre>`;
  }
}

export default new IndentedCodeBlockParser();
