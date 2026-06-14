import type { BaseBlockParser, BaseInlineParser } from "@/transformer/core/ParserBase";
import type { SyntaxMap } from "@/transformer/utils/syntaxMap.js";

export interface TransformerEngineOptions {
  inlineParsers?: SyntaxMap<BaseInlineParser>;
  blockParsers?: SyntaxMap<BaseBlockParser>;
  syntaxOptions?: Record<string, Record<string, unknown>>;
}
