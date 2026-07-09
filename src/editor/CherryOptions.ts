import type { EditorLayoutMode } from "@/editor/Layout";
import type { EditorOptions } from "@/editor/editor/EditorOptions";
import type { PreviewOptions } from "@/editor/preview/PreviewOptions";
import type { SideBarOptions } from "@/editor/sidebar/SideBarOptions";
import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";
import type { LightDark } from "@/theme/Theme";

/** 内置 action id：translate | continue | polish | custom */
export type CherryAIAction = string;

export interface CherryAIItem {
  /** 操作 id，传给 AIRequest 的第一个参数 */
  id: CherryAIAction;
  /** 覆盖默认文案（内置项有默认值） */
  label?: string;
  /** SVG 字符串，内置项有默认 icon；外部新增项必填 */
  icon?: string;
}

export interface CherryAIOptions {
  /**
   * 唯一对外请求入口，由宿主实现。
   * @param action  操作 id（内置或自定义 item id）
   * @param text    当前选中文本
   * @param prompts 仅「自定义」操作时传入用户输入；其余内置项不传
   */
  AIRequest: (
    action: string,
    text: string,
    prompts?: string,
  ) => Promise<string>;

  /**
   * 工具栏 AI 菜单项列表，按数组顺序渲染。
   * 可删除、重排、追加；省略时使用内置默认十项。
   */
  items?: CherryAIItem[];
}

export interface StorageAPI {
  upload?: (
    file: File,
    context: {
      source: "paste" | "drag" | "dialog" | "ai";
      dialogType?: string; // 区分是 image, video 还是 audio dialog
    },
  ) => Promise<{ url: string; [key: string]: unknown }>;
}

/** {@link Cherry} 构造选项 */
export interface CherryOptions {
  /** 实例标识，用于事件载荷 */
  id?: string;
  /** 初始布局，默认 `split` */
  layout?: EditorLayoutMode;
  /** 初始明暗，默认 `light` */
  appearance?: LightDark;
  /** 主题 id，默认 `default` */
  themeId?: string;
  /** 调试模式，透传给 {@link Theme}；开启后 `theme.logD` 才会输出 */
  debug?: boolean;
  /** `false` 时不实例化工具栏 */
  toolbar?: ToolbarOptions | false;
  /** 侧边栏配置，传 `false` 时隐藏 */
  sidebar?: SideBarOptions | boolean;
  /** `false` 时隐藏底部状态栏，默认为 `true` */
  statusbar?: boolean;
  /** 存储相关的 API 契约配置 */
  storage?: StorageAPI;
  /** `false` 时禁用 AI 功能 */
  ai?: CherryAIOptions | false;
  /** 编辑区选项 */
  editor?: EditorOptions;
  /** 预览区选项 */
  preview?: PreviewOptions;
  /** Transformer 解析选项 */
  transformer?: TransformerEngineOptions;
}
