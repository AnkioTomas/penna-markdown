import type { EditorLayoutMode } from "@/editor/Layout";
import type { EditorOptions } from "@/editor/editor/EditorOptions";
import type { PreviewOptions } from "@/editor/preview/PreviewOptions";
import type { SideBarOptions } from "@/editor/sidebar/SideBarOptions";
import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";
import { LightDark } from "@/theme/event/ThemeLightDarkEvent";
import type { StorageAPI } from "@/core/StorageAPI";

/** 文件解析/上传回调，由宿主实现 */
export type OnParseFile = (file: File) => Promise<{ url: string; msg: string }>;

/**
 * AI 请求回调，由宿主实现。
 * @param action  操作 id（内置或自定义 toolbar 子项 payload.action）
 * @param text    当前选中文本
 * @param prompts 仅「自定义」操作时传入用户输入
 */
export type OnAiRequest = (
  action: string,
  text: string,
  prompts?: string,
  onUpdate?: (content: string, thinking?: string) => void,
) => Promise<string>;

/** {@link Cherry} 构造选项 */
export interface CherryOptions {
  /** 初始布局，默认 `split` */
  layout?: EditorLayoutMode;
  /** 初始明暗，默认 `light` */
  appearance?: LightDark;
  /** 主题 id，默认 `default` */
  themeId?: string;
  /**
   * 可用主题白名单，控制 {@link Theme} 与工具栏主题菜单。
   * 省略时使用全部内置主题；传入 `["github"]` 则仅显示该主题。
   */
  themes?: string[];
  /** 调试模式，透传给 {@link Theme}；开启后 `theme.logD` 才会输出 */
  debug?: boolean;
  /** `false` 时不实例化工具栏 */
  toolbar?: ToolbarOptions | false;
  /** 侧边栏配置，传 `false` 时隐藏 */
  sidebar?: SideBarOptions | boolean;
  /** `false` 时隐藏底部状态栏，默认为 `true` */
  statusbar?: boolean;
  /** 本地存储 API，默认使用 `localStorage` */
  storage?: StorageAPI;
  /**
   * AI 请求回调；与 `editor.onAiRequest` 等价，`editor` 内配置优先。
   * 未配置时 AI 工具栏命令会静默失败。
   */
  onAiRequest?: OnAiRequest;
  /** 文件解析/上传回调；与 `editor.onParseFile` 等价，`editor` 内配置优先。 */
  onParseFile?: OnParseFile;
  /** 编辑区选项 */
  editor?: EditorOptions;
  /** 预览区选项 */
  preview?: PreviewOptions;
}
