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
        let innerLines: string[] = [];

        let length = 0;

        let i = index;

        while (i < lines.length) {
            const ln = lines[i];
            length += ln.length;

            // 无 > 前缀的空行始终结束引用块（GFM #220、#226）
            if (isBlankString(ln)) {
                i += 1;
                break;
            }

            // --- 1. 当前行依然是引用块 ---
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

            // --- 2. 遇阻时，调用通用惰性延续探针 ---
            if (canGenericLazyContinue(
                ctx,
                normalizeInnerLines(innerLines),
                ln,
                // 传入当前上下文的解析能力
                (probeLines) => ctx.parseBlocks(probeLines)
            )) {
                length += ln.length;
                // 把未做任何剥离的原始行塞进去，供内层继续探测
                innerLines.push(ln);
                i += 1;
                continue;
            }

            break;
        }


        ctx.markLinesInContainer(innerLines);

        const node = createNode("blockquote", length, undefined, ctx.parseBlocks(innerLines));

        return {node, nextIndex: i};
    }

    /** @inheritdoc */
    render(node: MarkdownNode, ctx: RenderContext) {
        const inner = ctx.renderBlock(node.children);
        if (!inner) return "<blockquote>\n</blockquote>";
        return `<blockquote>\n${inner}\n</blockquote>`;
    }
}

export default new BlockquoteBlockParser();