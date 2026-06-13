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
import {isBlankString} from "@/transformer/utils/normalize";

/**
 * 纯游标扫描：解析该行的缩进列数，并剥离掉最多 4 列的缩进。
 * （Tab 补齐到 4 的倍数，空格算 1）
 */
function parseIndentedLine(line: string): { isCode: boolean, isBlank: boolean, content: string } {
  let col = 0;
  let i = 0;

  // 计算列数，直到达到 4 列或遇到非空白字符
  for (; i < line.length; i++) {
    if (col >= 4) break;

    if (line[i] === ' ') {
      col += 1;
    } else if (line[i] === '\t') {
      col += 4 - (col % 4); // Tab 对齐到下一个 4 的倍数列
    } else {
      break;
    }
  }

  const isBlank = isBlankString(line);

  if (col >= 4) {
    // 成功达到了 4 列缩进，剥离这部分缩进，保留后面的原文（包括多余的空格）
    return { isCode: true, isBlank, content: line.slice(i) };
  } else {
    // 缩进不足 4 列：如果它是空行，按规范内容视为空字符串；否则不是代码行
    return { isCode: false, isBlank, content: "" };
  }
}

/**
 * 缩进代码块解析器。
 * * 无正则、精准处理 Tab/空格列数、完美处理空行缓冲。
 * @extends {BaseBlockParser}
 */
class IndentedCodeBlockParser extends BaseBlockParser {
  constructor() {
    super("indented-code", 2000); // 优先级应高于 Paragraph，但低于 List/Blockquote
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    const line = lines[index] ?? "";

    // 1. 防御：缩进代码块绝对不能打断段落！
    // 如果它紧跟在非空行后面，它只能算作段落的普通文本。
    if (index > 0 && !isBlankString(lines[index - 1] ?? "")) {
      return false;
    }

    const info = parseIndentedLine(line);

    // 2. 规范：全是空白符的空行（即使有4个空格）不能单独作为代码块的起始行
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

    // 用于缓冲尾部空行（CommonMark 规范：缩进代码块的尾部空行不计入代码块内）
    let pendingBlankLines: string[] = [];
    let pendingLength = 0;

    while (i < lines.length) {
      const line = lines[i];
      const info = parseIndentedLine(line);

      if (info.isCode) {
        // 如果之前缓冲了空行，现在遇到有效代码行，说明空行被夹在中间，一并推入
        if (pendingBlankLines.length > 0) {
          contentLines.push(...pendingBlankLines);
          length += pendingLength;
          pendingBlankLines = [];
          pendingLength = 0;
        }

        contentLines.push(info.content);
        length += line.length;
        i++;
      } else if (info.isBlank) {
        // 遇到空行（可能不足 4 个空格）：暂时放入缓冲池
        pendingBlankLines.push("");
        pendingLength += line.length;
        i++;
      } else {
        // 既不是 4 空格缩进，也不是空行 -> 代码块被强行打断，结束解析
        break;
      }
    }

    // 循环结束后，游标 i 需要回退，把吞掉的“尾部空行”吐出来还给外层引擎
    i -= pendingBlankLines.length;

    const node = createNode(this.type, length, undefined, [], {
      content: contentLines.join("\n"),
      lang: "" // 缩进代码块天然不支持语言高亮
    });

    return { node, nextIndex: i };
  }

  /** @inheritdoc */
  render(node: MarkdownNode) {
    const content = node.props?.content as string || "";
    return `<pre><code>${escapeHtml(content)}\n</code></pre>`;
  }
}

export default new IndentedCodeBlockParser();