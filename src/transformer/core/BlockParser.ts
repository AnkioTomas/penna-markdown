/**
 * @file 块级语法解析引擎
 * @module transformer/core/BlockParser
 */

import {createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
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
            private containerDepth = 0;

            readonly store: ParserStore = store;

            inContainer(): boolean {
                return this.containerDepth > 0;
            }

            enterContainer(): void {
                this.containerDepth += 1;
            }

            exitContainer(): void {
                this.containerDepth -= 1;
            }

            parseBlocks(lines: string[]): MarkdownNode[] {
                return that.parseBlocks(lines);
            }

            parseInline(text: string): MarkdownNode[] {
                return that.__parseInline(text);
            }

            canStrongBreak(lines: string[], index: number, strong = true): boolean {
                return that.canStrongBreak(lines, index, strong);
            }

            parseBlockAt(lines: string[], index: number, strongBreak?: boolean) {
                return that.parseBlockAt(lines, index, strongBreak);
            }
        };
    }

    canStrongBreak(lines: string[], index: number, strong = true): boolean {
        for (const parser of this.registry.getBlockParsers()) {
            if (parser.strongBreak !== strong) continue;
            if (parser.type === "paragraph") continue;
            if (parser.canOpenAt(lines, index, this.ctx)) {
                return true;
            }
        }
        return false;
    }

    parseBlockAt(
        lines: string[],
        index: number,
        strongBreak?: boolean,
    ): { nextIndex: number; node: MarkdownNode | null } {
        for (const parser of this.registry.getBlockParsers()) {
            if (strongBreak !== undefined && parser.strongBreak !== strongBreak) continue;
            if (parser.canOpenAt(lines, index, this.ctx)) {
                const result = parser.parse(lines, index, this.ctx);
                if (result) {
                    return { nextIndex: result.nextIndex, node: result.node ?? null };
                }
            }
        }
        return { nextIndex: index + 1, node: null };
    }

    parseBlocks(lines: string[]): MarkdownNode[] {
        const children: MarkdownNode[] = [];
        let index = 0;

        while (index < lines.length) {
            const { nextIndex, node } = this.parseBlockAt(lines, index);
            if (node) {
                children.push(node);
            }
            index = nextIndex;
        }

        return children;
    }

    parse(lines: string[]): MarkdownNode {
        const root = createNode('root', 0, undefined, this.parseBlocks(lines), {store: null});
        return this.store.finalize(root, this.ctx);
    }
}
