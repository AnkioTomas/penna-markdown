import { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";

export interface PreviewOptions {
  transformerEngineOptions?: TransformerEngineOptions;
  /** 仅预览模式下的最大宽度限制，例如 800 或 "50rem" */
  maxWidth?: number | string;
  /** 代码块超长行自动换行，默认 false（横向滚动） */
  codeWrap?: boolean;
}
