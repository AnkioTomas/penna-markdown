/**
 * @file 块级语法：围栏代码块
 * @module transformer/gfm/block/code
 *
 * Fenced Code Block：以 ``` 或 ~~~ 包裹的代码块，可选 info string 指定语言。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";

/**
 * 围栏代码块解析器。
 * * 采用逐字符分析，避免使用正则表达式以提升性能和严格遵守 CommonMark/GFM 规范。
 * @extends {BaseBlockParser}
 */
class CodeBlockParser extends BaseBlockParser {
  constructor() {
    super("code");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    const line = lines[index] ?? "";
    const indent = skipBlockPrefixSpaces(line);
    if (indent >= 4) return false;

    const fenceChar = line[indent];
    if (fenceChar !== '`' && fenceChar !== '~') return false;

    let fenceLength = 0;
    let i = indent;
    while (i < line.length && line[i] === fenceChar) {
      fenceLength++;
      i++;
    }

    return fenceLength >= 3;
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";

    const indentCount = skipBlockPrefixSpaces(line);
    if (indentCount >= 4) return null;

    const fenceChar = line[indentCount];
    if (fenceChar !== '`' && fenceChar !== '~') return null;

    let p = indentCount;
    let fenceLength = 0;
    while (p < line.length && line[p] === fenceChar) {
      fenceLength++;
      p++;
    }

    if (fenceLength < 3) return null;

    // 提取 info string
    const infoRaw = line.slice(p);

    // GFM 规范：如果使用反引号作为围栏，info string 中不能包含反引号
    if (fenceChar === '`' && infoRaw.includes('`')) return null;

    // 获取语言 (info string 的第一个单词)
    const info = infoRaw.trim();
    let lang = "";
    for (let char of info) {
      if (char === ' ' || char === '\t') break;
      lang += char;
    }

    // --- 解析内容与闭合行 (Content and End line) ---
    const contentLines: string[] = [];
    let length = 0;
    let i = index + 1;

    while (i < lines.length) {
      const currentLine = lines[i];
      length += currentLine.length;

      // 1. 检查是否是闭合行
      let endIndent = 0;
      while (endIndent < currentLine.length && currentLine[endIndent] === ' ' && endIndent < 4) {
        endIndent++;
      }

      if (endIndent < 4) {
        let endP = endIndent;
        let endFenceCount = 0;

        // 统计闭合围栏字符
        while (endP < currentLine.length && currentLine[endP] === fenceChar) {
          endFenceCount++;
          endP++;
        }

        // 闭合围栏需要符合：相同字符且长度 >= 起始围栏长度
        if (endFenceCount >= fenceLength) {
          // 检查闭合围栏之后是否只有空白字符
          let isOnlyWhitespace = true;
          for (let j = endP; j < currentLine.length; j++) {
            if (currentLine[j] !== ' ' && currentLine[j] !== '\t') {
              isOnlyWhitespace = false;
              break;
            }
          }

          if (isOnlyWhitespace) {
            i += 1;
            break; // 成功闭合
          }
        }
      }

      // 2. 处理内容行的缩进剥离 (CommonMark 规范)
      let lineToPush = currentLine;
      if (indentCount > 0) {
        let currentSpaceCount = 0;
        // 剥离与起始行相同数量的空格，如果不足则只剥离现有的空格
        while (currentSpaceCount < currentLine.length && currentLine[currentSpaceCount] === ' ' && currentSpaceCount < indentCount) {
          currentSpaceCount++;
        }
        lineToPush = currentLine.slice(currentSpaceCount);
      }

      contentLines.push(lineToPush);
      i += 1;
    }

    const node = createNode(
        this.type,
        length,
        contentLines.join("\n"),
        [],
        { lang }
    );

    return { node, nextIndex: i };
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    const lang = node.props?.lang as string;
    const content = node.value as string;
    const classAttr = lang ? ` class="language-${escapeHtml(lang)}"` : "";
    const suffix = content === "" ? "" : "\n";
    return `<pre><code${classAttr}>${escapeHtml(content)}${suffix}</code></pre>`;
  }
}

export default new CodeBlockParser();