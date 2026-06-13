/**
 * @file 块级语法解析引擎
 * @module transformer/core/BlockParser
 */

import {createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
import type {BlockParseResult} from "@/transformer/core/ParserBase.js";
import type {Registry} from "@/transformer/core/Registry.js";
import {ParserStore} from "@/transformer/core/ParserStore.js";
import {BlockParseContext} from "@/transformer/core/context/BlockParseContext";

export class BlockParseEngine {
    readonly registry: Registry;
    readonly ctx: BlockParseContext;
    readonly store: ParserStore;
    private readonly __parseInline: (text: string) => MarkdownNode[];

    constructor(registry: Registry, store: ParserStore, parseInline: (text: string) => MarkdownNode[]) {
        this.registry = registry;
        this.store = store;
        this.__parseInline = parseInline;
        const that = this;
        this.ctx = new class implements BlockParseContext {
            readonly store: ParserStore = store;

            parseBlocks(lines: string[]): MarkdownNode[] {
                return that.parseBlocks(lines)
            }

            parseInline(text: string): MarkdownNode[] {
                return that.__parseInline(text);
            }

            isBlockStarter(line: string): boolean {
                const dummyLines = [line];

                // 遍历所有注册的块级解析器 (注意：优先级最高的先遍历)
                for (const parser of that.registry.getBlockParsers()) {
                    // 排除掉 Paragraph 本身，因为纯文本肯定能被段落接受
                    if (parser.type === 'paragraph') continue;

                    // 如果有任何一个高优先级的解析器说“我能解析这行作为开头！”
                    // 那就说明这是一个强起点，需要打断！
                    if (parser.canOpenAt(dummyLines, 0, this)) {
                        return true;
                    }
                }

                return false;
            }
        }
    }


    parseBlocks(lines: string[]): MarkdownNode[] {
        const children: MarkdownNode[] = [];
        let index = 0;

        while (index < lines.length) {
            let result: BlockParseResult | null = null;

            for (const parser of this.registry.getBlockParsers()) {
                if (parser.canOpenAt(lines,index,this.ctx)){
                    result = parser.parse(lines, index, this.ctx);
                    if (result) break;
                }
            }


            if (result?.node) {
                children.push(result.node);
            }
            index = result?.nextIndex ?? index + 1;
        }

        return children;
    }

    parse(lines: string[]): MarkdownNode {
        return createNode('root', 0, undefined, this.parseBlocks(lines), {store: null});
    }
}
