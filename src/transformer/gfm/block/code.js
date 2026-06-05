/**
 * 块级语法：代码块 (Fenced Code Block)
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";

class CodeBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "code", priority: 100 });
  }

  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    // 匹配 0-3 个空格，紧接着 3 个及以上 ` 或 ~
    // 根据 CommonMark: backtick fence 的 info string 不能包含 backtick
    // tilde fence 的 info string 则没有包含 tilde 的限制 (Example 116)
    const match = line.match(/^( {0,3})((`{3,})([^`]*)|(~{3,})(.*))$/);
    if (!match) return null;

    const indent = match[1];
    const fence = match[3] || match[5];
    const info = (match[4] || match[6] || "").trim();
    
    const fenceChar = fence[0];
    const fenceLength = fence.length;
    
    // GFM: info string 取第一个单词作为语言
    const lang = info.split(/\s+/)[0];

    const contentLines = [];
    let i = index + 1;
    while (i < lines.length) {
      const currentLine = lines[i];
      // 结束符：0-3 个空格，至少相同数量的 fence 字符
      const endMatch = currentLine.match(/^( {0,3})(`{3,}|~{3,})[ \t]*$/);
      if (
        endMatch &&
        endMatch[2][0] === fenceChar &&
        endMatch[2].length >= fenceLength
      ) {
        i += 1;
        break;
      }
      
      // 去掉与起始行相同的缩进（最多）
      let lineToPush = currentLine;
      if (indent.length > 0) {
        if (currentLine.startsWith(indent)) {
          lineToPush = currentLine.slice(indent.length);
        } else {
          // 如果某行缩进不足，则去掉所有行首空格（CommonMark 规范）
          lineToPush = currentLine.trimStart();
        }
      }
      
      contentLines.push(lineToPush);
      i += 1;
    }

    const node = createNode(this.type, {
      content: contentLines.join("\n"),
      lang: lang
    });

    return { node, nextIndex: i };
  }

  render(node) {
    const { content, lang } = node.props;
    const classAttr = lang ? ` class="language-${escapeHtml(lang)}"` : "";
    const suffix = content === "" ? "" : "\n";
    return `<pre><code${classAttr}>${escapeHtml(content)}${suffix}</code></pre>`;
  }
}

export default new CodeBlockParser();
