/**
 * 段落块解析器（兜底块级语法，priority 最低）。
 *
 * @extends {BaseBlockParser}
 */
import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";
import { isBlankString } from "@/transformer/utils/normalize";
import {
  isIndentedCodeLine,
  stripVisualIndent,
} from "@/transformer/utils/tabs.js";

class ParagraphBlockParser extends BaseBlockParser {
  constructor() {
    super("paragraph", false);
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    let i = index;
    const paragraphLines: string[] = [];

    while (i < lines.length) {
      const line = lines[i];

      if (isBlankString(line)) {
        break;
      }

      // 2. 强块级起点打断（缩进代码块不能打断段落，见 CommonMark §4.8）
      if (
        i > index &&
        ctx.canStrongBreak(lines, i) &&
        !isIndentedCodeLine(line)
      ) {
        break;
      }

      // 3. 消费该行：缩进代码剥 4 列；否则剥块级前导空格（最多 3 列）
      let text: string;
      if (i > index && isIndentedCodeLine(line)) {
        text = stripVisualIndent(line);
      } else {
        text = line.slice(skipBlockPrefixSpaces(line));
      }
      paragraphLines.push(text);
      i += 1;
    }

    if (paragraphLines.length === 0) return null;

    // CommonMark：段落末尾的行尾空白在解析 inline 前剥离（行内 hard break 的空格在 \n 前，不受影响）
    const content = paragraphLines.join("\n").replace(/[ \t]+$/, "");

    const node = createNode(
      this.type,
      i - index,
      undefined,
      ctx.parseInline(content), // 把合并后的多行完整文本扔给内联解析器
    );

    return { node, nextIndex: i };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    return `<p${this.sourceLineAttrs(node)}>${ctx.renderInline(node.children)}</p>`;
  }
}

export default new ParagraphBlockParser();
