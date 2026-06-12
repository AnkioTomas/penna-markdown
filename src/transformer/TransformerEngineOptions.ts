import type {BaseBlockParser, BaseInlineParser} from "@/transformer/core/ParserBase";

export interface TransformerEngineOptions {
    inlineParsers?: BaseInlineParser[];
    blockParsers?: BaseBlockParser[];
    syntaxOptions?: Record<string, Record<string, any>>
}