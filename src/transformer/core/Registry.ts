/**
 * @file 语法注册表
 * @module transformer/core/Registry
 */

import type {
  BaseBlockParser,
  BaseInlineParser,
  SyntaxOptions,
} from "@/transformer/core/ParserBase";
import { gfmBlockSyntax, gfmInlineSyntax } from "@/transformer/gfm/index.js";
import { extendBlockSyntax, extendInlineSyntax } from "@/transformer/extends";

type InlineEntry = { parser: BaseInlineParser; priority: number };
type BlockEntry = { parser: BaseBlockParser; priority: number };

export class Registry {
  private readonly _inline: InlineEntry[] = [];
  private readonly _block: BlockEntry[] = [];

  constructor() {
    for (const [pri, parser] of Object.entries(gfmInlineSyntax)) {
      this.registerInlineParser(parser, Number(pri));
    }
    for (const [pri, parser] of Object.entries(gfmBlockSyntax)) {
      this.registerBlockParser(parser, Number(pri));
    }
    for (const [pri, parser] of Object.entries(extendInlineSyntax)) {
      this.registerInlineParser(parser, Number(pri));
    }
    for (const [pri, parser] of Object.entries(extendBlockSyntax)) {
      this.registerBlockParser(parser, Number(pri));
    }
  }

  registerInlineParser(parser: BaseInlineParser, priority: number): void {
    if (!parser?.type) throw new TypeError("parser required type parameter");
    const idx = this._inline.findIndex((e) => e.parser.type === parser.type);
    const entry = { parser, priority };
    if (idx >= 0) this._inline[idx] = entry;
    else this._inline.push(entry);
    this._inline.sort((a, b) => b.priority - a.priority);
  }

  registerBlockParser(parser: BaseBlockParser, priority: number): void {
    if (!parser?.type) throw new TypeError("parser required type parameter");
    const idx = this._block.findIndex((e) => e.parser.type === parser.type);
    const entry = { parser, priority };
    if (idx >= 0) this._block[idx] = entry;
    else this._block.push(entry);
    this._block.sort((a, b) => b.priority - a.priority);
  }

  getInlineParsers(): BaseInlineParser[] {
    return this._inline.map((e) => e.parser);
  }

  getBlockParsers(): BaseBlockParser[] {
    return this._block.map((e) => e.parser);
  }

  getInlineParser(type: string): BaseInlineParser | undefined {
    return this._inline.find((e) => e.parser.type === type)?.parser;
  }

  getBlockParser(type: string): BaseBlockParser | undefined {
    return this._block.find((e) => e.parser.type === type)?.parser;
  }

  clearParserOptions(): void {
    for (const entry of this._inline) entry.parser.clearOptions();
    for (const entry of this._block) entry.parser.clearOptions();
  }

  setOptions(syntaxOptions: SyntaxOptions): void {
    for (const [key, options] of Object.entries(syntaxOptions)) {
      this.getInlineParser(key)?.setOptions(options);
      this.getBlockParser(key)?.setOptions(options);
    }
  }

  setRenderOptions(renderOptions: Record<string, unknown> = {}): void {
    for (const entry of this._block) {
      entry.parser.setOptions(renderOptions);
    }
  }
}
