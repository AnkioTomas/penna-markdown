/**
 * @file 块级语法：段落
 * @module transformer/gfm/block/paragraph
 *
 * CommonMark 段落：连续非空行合并，可被高优先级块级语法中断。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

/**
 * 段落块解析器（兜底块级语法，priority 最低）。
 *
 * @extends {BaseBlockParser}
 */
class ParagraphBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "paragraph", priority: -1000, canInterruptParagraph: false });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    if (line.trim() === "") return null;

    const chunks = [];
    let i = index;
    while (i < lines.length) {
      const ln = lines[i] ?? "";
      if (ln.trim() === "") break;

      // 如果当前行可以被其他语法中断，则停止当前段落
      if (i > index && ctx.checkInterrupt(lines, i)) {
        break;
      }

      // 按照 CommonMark 规范，每行最多移除 3 个前导空格
      chunks.push(ln.replace(/^ {0,3}/, ''));
      i += 1;
    }

    // 合并行，并移除整个段落末尾的空白字符
    const content = chunks.join("\n").replace(/[ \t]+$/, '');

    const node = createNode(this.type, {
      children: ctx.parseInline(content),
    });

    return { node, nextIndex: i };
  }

  /** @inheritdoc */
  render(node, ctx) {
    return `<p>${ctx.renderInline(node.children)}</p>`;
  }
}

export default new ParagraphBlockParser();
