import type { BaseBlockParser, BaseInlineParser, SyntaxOptions } from "@/transformer/core/ParserBase";

export interface TransformerEngineOptions {
  inlineParsers?: Record<number, BaseInlineParser>;
  blockParsers?: Record<number, BaseBlockParser>;
  syntaxOptions?: SyntaxOptions;
  renderOptions?: Record<string, unknown>;
  /** 暗色主题；影响公式 / Mermaid / ECharts 远程图渲染。由外部传入，引擎不做 DOM 检测。 */
  isDark?: boolean;
}
