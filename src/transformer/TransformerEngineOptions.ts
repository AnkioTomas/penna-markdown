import type {BaseBlockParser, BaseInlineParser} from "@/transformer/core/ParserBase";

export interface TransformerEngineOptions {
    inlineParsers?: BaseInlineParser[];
    blockParsers?: BaseBlockParser[];
    SyntaxOptions?: Record<string, Record<string, any>>
}