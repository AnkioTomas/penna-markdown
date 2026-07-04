import type { Extension } from "@codemirror/state";
import type { EditorCustomTagHighlight } from "./cmSyntax";
import type { TransformerHighlightOptions } from "./cmDecorations";
import type { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";

export interface EditorOptions {
  /** 初始 Markdown 正文 */
  value?: string;
  /** 显示行号，默认 `true` */
  lineNumbers?: boolean;
  /** 额外 CodeMirror 6 扩展 */
  extensions?: Extension | Extension[];
  /** 自定义 Lezer syntax tag 高亮 */
  customTagHighlights?: EditorCustomTagHighlight[];
  /** transformer 扩展语法 decoration 高亮，默认开启；`false` 关闭 */
  transformerHighlight?: boolean | TransformerHighlightOptions;
  /** 传给 transformer 高亮的解析选项 */
  transformerEngineOptions?: TransformerEngineOptions;
}
