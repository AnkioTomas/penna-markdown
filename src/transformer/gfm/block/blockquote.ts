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
import {isBlank, isBlankString, normalizeInnerLines} from "@/transformer/utils/normalize";
import {canGenericLazyContinue} from "@/transformer/utils/lazyContinuation";

/**
 * 提取 Blockquote 标记，返回实际内容的起始索引。
 * CommonMark 规范: 0-3 个前置空格 + '>' + 可选的 1 个跟随空格。
 * * @param line 当前行字符串
 * @returns 剥离 marker 后的起始索引。如果不是引用块行，返回 -1。
 */
function getBlockquoteContentStartIndex(line: string): number {
    let i = 0;
    let spaceCount = 0;

    // 1. 跳过最多 3 个前导空格
    while (i < line.length && line[i] === ' ' && spaceCount < 3) {
        spaceCount++;
        i++;
    }

    // 2. 检查 Marker (必须是 '>')
    if (i >= line.length || line[i] !== '>') {
        return -1;
    }

    i++; // 跳过 '>'

    // 3. 剥离可选的 1 个跟随空格
    if (i < line.length && line[i] === ' ') {
        i++;
    }

    return i;
}

/**
 * 引用块解析器。
 * * 采用游标遍历，移除正则，合并 marker 剥离操作以提升解析性能。
 * @extends {BaseBlockParser}
 */
class BlockquoteBlockParser extends BaseBlockParser {
    constructor() {
        super("blockquote", 4000); // 假定 super 接受 (type, priority)
    }

    /** @inheritdoc */
    canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
        const line = lines[index] ?? "";
        return getBlockquoteContentStartIndex(line) !== -1;
    }

    /** @inheritdoc */
    parse(lines: string[], index: number, ctx: BlockParseContext) {
        const line = lines[index] ?? "";
        const startIndex = getBlockquoteContentStartIndex(line);
        if (startIndex === -1) return null;
        let innerLines: string[] = [];

        let length = 0;

        let i = index;

        while (i < lines.length) {
            const ln = lines[i];
            length += ln.length;
            const contentStart = getBlockquoteContentStartIndex(ln);

            // --- 1. 当前行依然是引用块 ---
            if (contentStart !== -1) {
                length += ln.length;
                const stripped = ln.slice(contentStart);

                if (isBlankString(stripped)) {
                    const next = lines[i + 1] ?? "";
                    // 检查下一行是否仍然在引用块中
                    if (getBlockquoteContentStartIndex(next) !== -1) {
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