/**
 * @file 语法注册表
 * @module transformer/core/Registry
 */

import type { MarkdownNode } from "./MarkdownNode.js";
import type { BaseBlockParser, BaseInlineParser } from "./ParserBase.js";
import {RenderContext} from "@/transformer/core/context/RenderContext";
import {gfmBlockSyntax, gfmInlineSyntax} from "@/transformer/gfm";
import {extendBlockSyntax, extendInlineSyntax} from "@/transformer/extends";

export type NodeRenderer = (node: MarkdownNode, ctx: RenderContext) => string;

export class Registry {
  readonly inlineParsers = new Map<string, BaseInlineParser>();
  readonly blockParsers = new Map<string, BaseBlockParser>();
  private _sortedInline: BaseInlineParser[] | null = null;
  private _sortedBlock: BaseBlockParser[] | null = null;
  private _

  constructor() {
    for (const p of gfmInlineSyntax) this.registerInlineParser(p);
    for (const p of gfmBlockSyntax) this.registerBlockParser(p);
    for (const p of extendInlineSyntax) this.registerInlineParser(p);
    for (const p of extendBlockSyntax) this.registerBlockParser(p);
  }

  private _invalidateCache(): void {
    this._sortedInline = null;
    this._sortedBlock = null;
  }

  private _register(
    map: Map<string, BaseInlineParser | BaseBlockParser>,
    parser: BaseInlineParser | BaseBlockParser,
  ): void {
    if (!parser?.type) throw new TypeError("parser required type parameter");
    map.set(parser.type, parser as BaseInlineParser & BaseBlockParser);
    this._invalidateCache();
  }

  registerInlineParser(parser: BaseInlineParser): void {
    this._register(this.inlineParsers, parser);
  }

  registerBlockParser(parser: BaseBlockParser): void {
    this._register(this.blockParsers, parser);
  }


  getInlineParsers(): BaseInlineParser[] {
    if (!this._sortedInline) {
      this._sortedInline = [...this.inlineParsers.values()].sort(
        (a, b) => b.priority - a.priority,
      );
    }
    return this._sortedInline;
  }

  getBlockParsers(): BaseBlockParser[] {
    if (!this._sortedBlock) {
      this._sortedBlock = [...this.blockParsers.values()].sort(
        (a, b) => b.priority - a.priority,
      );
    }
    return this._sortedBlock;
  }

  getInlineParser(type: string): BaseInlineParser | undefined {
    return this.inlineParsers.get(type);
  }

  getBlockParser(type: string): BaseBlockParser | undefined {
    return this.blockParsers.get(type);
  }


  setOptions(syntaxOptions: Record<string, Record<string, any>>) {
    for (const [key, options] of Object.entries(syntaxOptions)) {
      this.inlineParsers.get(key)?.setOptions(options);
      this.blockParsers.get(key)?.setOptions(options);
    }
  }
}
