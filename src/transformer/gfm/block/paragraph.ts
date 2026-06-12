/**
 * @file 块级语法：段落
 * @module transformer/gfm/block/paragraph
 *
 * CommonMark 段落：连续非空行合并，可被高优先级块级语法中断。
 */

import {BaseBlockParser} from "@/transformer/core/ParserBase.js";
import {createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
import {RenderContext} from "@/transformer/core/context/RenderContext";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";

/**
 * 段落块解析器（兜底块级语法，priority 最低）。
 *
 * @extends {BaseBlockParser}
 */
class ParagraphBlockParser extends BaseBlockParser {
    constructor() {
        super("paragraph", -1000);
    }

    /** @inheritdoc */
    parse(lines: string[], index: number, ctx: BlockParseContext) {
        const line = lines[index] ?? "";
        const node = createNode(this.type,line.length,line, ctx.parseInline(line));
        return {node, nextIndex: index + 1};
    }

    /** @inheritdoc */
    render(node: MarkdownNode, ctx: RenderContext ) {
        return `<p>${ctx.renderInline(node.children)}</p>`;
    }
}

export default new ParagraphBlockParser();
