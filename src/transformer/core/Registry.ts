/**
 * @file 语法注册表
 * @module transformer/core/Registry
 */

import type { BaseBlockParser, BaseInlineParser } from "./ParserBase.js";

export class Registry {
  readonly inlineParsers = new Map<string, BaseInlineParser>();
  readonly blockParsers = new Map<string, BaseBlockParser>();
  private readonly _inlinePriority = new Map<string, number>();
  private readonly _blockPriority = new Map<string, number>();
  private _sortedInline: BaseInlineParser[] | null = null;
  private _sortedBlock: BaseBlockParser[] | null = null;

  private _invalidateCache(): void {
    this._sortedInline = null;
    this._sortedBlock = null;
  }

  registerInlineParser(parser: BaseInlineParser, priority: number): void {
    if (!parser?.type) throw new TypeError("parser required type parameter");
    if (!Number.isFinite(priority)) throw new TypeError("priority required");
    this.inlineParsers.set(parser.type, parser);
    this._inlinePriority.set(parser.type, priority);
    this._invalidateCache();
  }

  registerBlockParser(parser: BaseBlockParser, priority: number): void {
    if (!parser?.type) throw new TypeError("parser required type parameter");
    if (!Number.isFinite(priority)) throw new TypeError("priority required");
    this.blockParsers.set(parser.type, parser);
    this._blockPriority.set(parser.type, priority);
    this._invalidateCache();
  }

  getInlineParsers(): BaseInlineParser[] {
    if (!this._sortedInline) {
      this._sortedInline = [...this.inlineParsers.values()].sort(
        (a, b) => (this._inlinePriority.get(b.type) ?? 0) - (this._inlinePriority.get(a.type) ?? 0),
      );
    }
    return this._sortedInline;
  }

  getBlockParsers(): BaseBlockParser[] {
    if (!this._sortedBlock) {
      this._sortedBlock = [...this.blockParsers.values()].sort(
        (a, b) => (this._blockPriority.get(b.type) ?? 0) - (this._blockPriority.get(a.type) ?? 0),
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

  setOptions(syntaxOptions: Record<string, Record<string, unknown>>): void {
    for (const [key, options] of Object.entries(syntaxOptions)) {
      this.inlineParsers.get(key)?.setOptions(options);
      this.blockParsers.get(key)?.setOptions(options);
    }
  }
}
