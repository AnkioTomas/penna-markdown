import {
  BaseBlockParser,
  BaseInlineParser,
} from "@/transformer/core/ParserBase";

export interface PreviewOptions {
  inlineParsers?: Record<number, BaseInlineParser>;
  blockParsers?: Record<number, BaseBlockParser>;
  /** 仅预览模式下的最大宽度限制，例如 800 或 "50rem" */
  maxWidth?: number | string;
}
