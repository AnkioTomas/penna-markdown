/**
 * @file 块级语法：引用块
 * @module transformer/gfm/block/blockquote
 *
 * CommonMark 引用块（`>` 前缀），支持 lazy continuation。
 */

import {BaseBlockParser} from "@/transformer/core/ParserBase.js";
import {createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
import {BlockParseContext} from "@/transformer/core/context/BlockParseContext";
import {RenderContext} from "@/transformer/core/context/RenderContext";
import {isBlankString, normalizeInnerLines} from "@/transformer/utils/normalize";
import {canGenericLazyContinue} from "@/transformer/utils/lazyContinuation";
import { stripBlockquoteMarker } from "@/transformer/utils/tabs.js";

const BLOCKQUOTE_LINE = /^( {0,3})>/;

/** 在 blockquote 容器上下文中执行 fn（供 alert 等嵌套引用场景复用） */
export function withBlockquoteFrame<T>(ctx: BlockParseContext, fn: () => T): T {
    ctx.enterContainer();
    try {
        return fn();
    } finally {
        ctx.exitContainer();
    }
}

/**
 * 引用块解析器。
 * * 采用游标遍历，移除正则，合并 marker 剥离操作以提升解析性能。
 * @extends {BaseBlockParser}
 */
class BlockquoteBlockParser extends BaseBlockParser {
    constructor() {
        super("blockquote")
    }

    /** @inheritdoc */
    canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
        const line = lines[index] ?? "";
        return BLOCKQUOTE_LINE.test(line);
    }

    /** @inheritdoc */
    parse(lines: string[], index: number, ctx: BlockParseContext) {
        const line = lines[index] ?? "";
        if (!BLOCKQUOTE_LINE.test(line)) return null;

        return withBlockquoteFrame(ctx, () => {
            let innerLines: string[] = [];
            let i = index;

            while (i < lines.length) {
                const ln = lines[i];

                if (isBlankString(ln)) {
                    i += 1;
                    break;
                }

                if (BLOCKQUOTE_LINE.test(ln)) {
                    const stripped = stripBlockquoteMarker(ln);

                    if (isBlankString(stripped)) {
                        const next = lines[i + 1] ?? "";
                        if (BLOCKQUOTE_LINE.test(next)) {
                            innerLines.push("");
                            i += 1;
                            continue;
                        }
                        i += 1;
                        break;
                    }

                    innerLines.push(stripped);
                    i += 1;
                    continue;
                }

                if (canGenericLazyContinue(
                    ctx,
                    normalizeInnerLines(innerLines),
                    ln,
                    (probeLines) => ctx.parseBlocks(probeLines)
                )) {
                    innerLines.push(ln);
                    i += 1;
                    continue;
                }

                break;
            }

            const node = createNode("blockquote", i - index, undefined, ctx.parseBlocks(innerLines));
            return {node, nextIndex: i};
        });
    }

    /** @inheritdoc */
    render(node: MarkdownNode, ctx: RenderContext) {
        const inner = ctx.renderBlock(node.children);
        if (!inner) return "<blockquote>\n</blockquote>";
        return `<blockquote>\n${inner}\n</blockquote>`;
    }
}

export default new BlockquoteBlockParser();