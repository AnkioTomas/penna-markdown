/**
 * @file 块级语法：标题
 * @module transformer/gfm/block/heading
 *
 * ATX 标题（# ~ ######）
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";

// 获取 ATX 的函数保持不变
function getAtxHeadingInfo(line: string): { level: number; content: string } | null {
    let i = 0; let spaceCount = 0;
    while (i < line.length && line[i] === ' ' && spaceCount < 3) { spaceCount++; i++; }
    if (i >= line.length || line[i] !== '#') return null;

    let level = 0;
    while (i < line.length && line[i] === '#' && level < 6) { level++; i++; }
    if (level === 0 || (i < line.length && line[i] === '#')) return null;
    if (i < line.length && line[i] !== ' ' && line[i] !== '\t') return null;

    let content = line.slice(i).trim(); // 简单去尾 # 的逻辑可以加上
    while(content.endsWith('#') && !content.endsWith('\\#')) {
        content = content.replace(/\s*#+$/, '');
    }
    return { level, content: content.trim() };
}

class HeadingBlockParser extends BaseBlockParser {
    constructor() { super("atx_heading", 1000); }

    canOpenAt(lines: string[], index: number, ctx: BlockParseContext) {
        return getAtxHeadingInfo(lines[index] ?? "") !== null;
    }

    parse(lines: string[], index: number, ctx: BlockParseContext) {
        const line = lines[index] ?? "";
        const atx = getAtxHeadingInfo(line);
        if (atx) {
            const node = createNode("atx_heading", line.length, undefined, ctx.parseInline(atx.content), {
                level: atx.level
            });
            return { node, nextIndex: index + 1 };
        }
        return null;
    }

    render(node: MarkdownNode, ctx: any) {
        const level = node.props?.level || 1;
        return `<h${level}>${ctx.renderInline(node.children)}</h${level}>`;
    }
}

export default new HeadingBlockParser();