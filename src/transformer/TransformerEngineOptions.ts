import type { BaseBlockParser, BaseInlineParser } from "@/transformer/core/ParserBase";

export interface TransformerEngineOptions {
  inlineParsers?: Record<number, BaseInlineParser>;
  blockParsers?: Record<number, BaseBlockParser>;
  syntaxOptions?: Record<string, Record<string, unknown>>;
}
