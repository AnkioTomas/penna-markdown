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
                    const lineCount = result.nextIndex - index;
                    let node = result.node ?? null;
                    if (!node && lineCount > 0) {
                        node = createNode(parser.type, lineCount, undefined, undefined, {
                            invisible: true,
                        });
                    }
                    if (node && node.length <= 0 && lineCount > 0) {
                        node.length = lineCount;
                    }
                    return { nextIndex: result.nextIndex, node };
                }
            }
        }
        return { nextIndex: index + 1, node: null };
    }

    parseBlocks(lines: string[], trackSourceLine = false): MarkdownNode[] {
        const children: MarkdownNode[] = [];
        let index = 0;

        while (index < lines.length) {
            const { nextIndex, node } = this.parseBlockAt(lines, index);
            let block = node;
            if (!block && nextIndex > index) {
                block = createNode("blank_line", nextIndex - index, undefined, undefined, {
                    invisible: true,
                });
            }
            if (block) {
                if (block.length <= 0) {
                    block.length = nextIndex - index;
                }
                if (trackSourceLine && !block.props?.invisible && block.type !== "blank_line") {
                    block.props = { ...block.props, sourceStartLine: index };
                }
                children.push(block);
            }
            index = nextIndex;
        }

        return children;
    }

    parse(lines: string[]): MarkdownNode {
        const blocks = this.parseBlocks(lines, true);
        const root = createNode('root', lines.length, undefined, blocks, {store: null});
        return this.store.finalize(root, this.ctx);
    }
}
