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
