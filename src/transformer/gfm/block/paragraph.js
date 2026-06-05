import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

class ParagraphBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "paragraph", priority: -1000, canInterruptParagraph: false });
  }

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

  render(node, ctx) {
    return `<p>${ctx.renderInline(node.children)}</p>`;
  }
}

export default new ParagraphBlockParser();
