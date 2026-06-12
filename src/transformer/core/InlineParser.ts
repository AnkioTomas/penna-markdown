/**
 * @file 行内语法解析引擎
 * @module transformer/core/InlineParser
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { Registry } from "@/transformer/core/Registry.js";
import  { ParserStore } from "@/transformer/core/ParserStore.js";
import {InlineParseContext} from "@/transformer/core/context/InlineParseContext";

export class InlineParseEngine {
  readonly registry: Registry;
  readonly store: ParserStore;
  readonly ctx: InlineParseContext;

  constructor(registry: Registry,store: ParserStore) {
    this.registry = registry;
    this.store = store;
    const that = this;
    this.ctx = new class implements InlineParseContext {
      readonly store: ParserStore = store;
      parseInline(text: string): MarkdownNode[] {
        return that.parse(text);
      }
    }
  }

  parse(src: string): MarkdownNode[] {
    const parsers = this.registry.getInlineParsers();
    const nodes: MarkdownNode[] = [];
    let index = 0;

    while (index < src.length) {
      let matched = false;
      for (const parser of parsers) {
        if (parser.canOpenAt(src,index,this.ctx)){
          const result = parser.parse(src, index, this.ctx);
          if (!result) continue;

          nodes.push(result.node);
          index = result.nextIndex;
          matched = true;
          break;
        }
      }

      if (!matched) {
        index += 1;
      }
    }

    return nodes;
  }
}
