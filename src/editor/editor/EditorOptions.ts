import type { OnAiRequest, OnParseFile } from "@/editor/PennaOptions";

export interface EditorOptions {
  /** 初始 Markdown 正文 */
  value?: string;
  /** 显示行号，默认 `true` */
  lineNumbers?: boolean;

  /** 文件解析/上传回调，粘贴或拖入文件时调用 */
  onParseFile?: OnParseFile;

  /** AI 请求回调；省略时不启用 AI 功能 */
  onAiRequest?: OnAiRequest;
}
