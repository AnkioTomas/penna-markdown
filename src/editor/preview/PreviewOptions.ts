import type { GraphEngines } from "@/renderer/graph/engines";
import { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";

export interface PreviewOptions {
  transformerEngineOptions?: TransformerEngineOptions;
  /** 仅预览模式下的最大宽度限制，例如 800 或 "50rem" */
  maxWidth?: number | string;
  /** 外部图表库（KaTeX / Mermaid / ECharts），透传给 Renderer */
  engines?: GraphEngines;
}
