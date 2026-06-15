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


            private containers = new Set<string>()

            private calcHash(lines:string[]){
              const text = lines.join('\n');

              let hash = 0;
              for (let i = 0; i < text.length; i++) {
                hash = ((hash << 5) - hash) + text.charCodeAt(i);
                hash |= 0; // 转为32位整数
              }

              return hash.toString(16);
            }

            private hashNumber(lines:string[], index:number){
              let hash = this.calcHash(lines);
              return `${hash}:${index}`;
            }
          markLinesInContainer(lines: string[]): void {
            let hash = this.calcHash(lines);

            for (let i = 0; i < lines.length; i++) {
              let h = `${hash}:${i}`;
              this.containers.add(h);
            }

          }
            markLineInContainer(lines: string[], index: number): void {
                let hash = this.hashNumber(lines, index);
                this.containers.add(hash);
            }
            inContainer(lines: string[], index: number): boolean {
                let hash = this.hashNumber(lines, index);
                return this.containers.has(hash);
            }
            readonly store: ParserStore = store;

            parseBlocks(lines: string[]): MarkdownNode[] {
                return that.parseBlocks(lines)
            }

            parseInline(text: string): MarkdownNode[] {
                return that.__parseInline(text);
            }

            isBlockStarter(lines: string[], index: number): boolean {
                for (const parser of that.registry.getBlockParsers()) {
                    if (parser.type === 'paragraph') continue;
                    if (parser.canOpenAt(lines, index, this)) {
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
