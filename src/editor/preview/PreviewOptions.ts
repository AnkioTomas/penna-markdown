import { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";
import type { GraphEngines } from "@/renderer/graph/graph";

export interface PreviewOptions {
  transformerEngineOptions?: TransformerEngineOptions;
  /** 仅预览模式下的最大宽度限制，例如 800 或 "50rem" */
  maxWidth?: number | string;
  /**
   * 本地图表引擎，透传给 Renderer。
   * 传入后公式 / Mermaid / ECharts 不再走远程 API。
   */
  engines?: GraphEngines;
}
