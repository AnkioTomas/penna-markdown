/**
 * 段落块解析器（兜底块级语法，priority 最低）。
 *
 * @extends {BaseBlockParser}
 */
import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { isBlankString } from "@/transformer/utils/normalize";
import { isIndentedCodeLine, stripVisualIndent } from "@/transformer/utils/tabs.js";

class ParagraphBlockParser extends BaseBlockParser {
    constructor() {
        super("paragraph");
    }

    /** @inheritdoc */
    parse(lines: string[], index: number, ctx: BlockParseContext) {
        let i = index;
        let length = 0;
        const paragraphLines: string[] = [];

        while (i < lines.length) {
            const line = lines[i];

            if (isBlankString(line)) {
                break;
            }

            // 2. 强块级起点打断（缩进代码块不能打断段落，见 CommonMark §4.8）
            if (i > index && ctx.isBlockStarter(line) && !isIndentedCodeLine(line)) {
                break;
            }

            // 3. 消费该行（惰性延续的缩进行剥掉一层 4 列缩进）
            const text = i > index && isIndentedCodeLine(line) ? stripVisualIndent(line) : line;
            paragraphLines.push(text);
            length += line.length;
            i += 1;
        }

        if (paragraphLines.length === 0) return null;

        // CommonMark 要求多行段落合并时，保留换行符。
        const content = paragraphLines.join("\n");

        const node = createNode(
            this.type,
            length, // 注意：如果你的 length 严格要求计算换行符，需补偿 (paragraphLines.length - 1)
            content,
            ctx.parseInline(content) // 把合并后的多行完整文本扔给内联解析器
        );

        return { node, nextIndex: i };
    }

    /** @inheritdoc */
    render(node: MarkdownNode, ctx: RenderContext) {
        return `<p>${ctx.renderInline(node.children)}</p>`;
    }
}

export default new ParagraphBlockParser();