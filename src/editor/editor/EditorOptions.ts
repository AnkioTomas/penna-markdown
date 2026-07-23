/** 文件解析/上传回调，由宿主实现 */
export type OnParseFile = (file: File) => Promise<{ url: string; msg: string }>;

/**
 * AI 请求回调，由宿主实现。
 * @param action  操作 id（内置或自定义 toolbar 子项 payload.action）
 * @param text    当前选中文本
 * @param prompts 仅「自定义」操作时传入用户输入
 * @param onUpdate 流式更新回调，应传入增量字符串 (delta) 而非全文。
 */
export type OnAiRequest = (
  action: string,
  text: string,
  prompts?: string,
  onUpdate?: (contentDelta?: string, thinkingDelta?: string) => void,
) => Promise<string>;

/**
 * 用户主动取消 AI 请求时的回调。
 * @param action 操作 id
 */
export type OnAiRequestCancel = (action: string) => void;

export interface EditorOptions {
  /** 初始 Markdown 正文 */
  value?: string;
  /** 显示行号，默认 `true` */
  lineNumbers?: boolean;

  /** 文件解析/上传回调，粘贴或拖入文件时调用 */
  onParseFile?: OnParseFile;

  /** AI 请求回调；省略时不启用 AI 功能 */
  onAiRequest?: OnAiRequest;

  /** AI 请求取消时的回调 */
  onAiRequestCancel?: OnAiRequestCancel;
}
