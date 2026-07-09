import type { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";
import type { CherryAIOptions, StorageAPI } from "@/editor/CherryOptions";

export interface EditorOptions {
  /** 初始 Markdown 正文 */
  value?: string;
  /** 显示行号，默认 `true` */
  lineNumbers?: boolean;

  /** 给 transformer 高亮的解析选项 */
  transformerEngineOptions?: TransformerEngineOptions;

  /** 存储 API 契约配置 */
  storage?: StorageAPI;

  /** `false` 时禁用 AI 功能 */
  ai?: CherryAIOptions | false;
}
