import {BaseBlockParser, BaseInlineParser} from "@/transformer/core/ParserBase";

export interface PreviewOptions {
  inlineParsers?: Record<number, BaseInlineParser>;
  blockParsers?: Record<number, BaseBlockParser>;
}
