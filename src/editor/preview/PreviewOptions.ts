import { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";

export interface PreviewOptions {
  transformerEngineOptions?: TransformerEngineOptions;
  /** 仅预览模式下的最大宽度限制，例如 800 或 "50rem" */
  maxWidth?: number | string;
}
