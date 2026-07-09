import type { EditorLayoutMode } from "@/editor/Layout";
import type { EditorOptions } from "@/editor/editor/EditorOptions";
import type { PreviewOptions } from "@/editor/preview/PreviewOptions";
import type { SideBarOptions } from "@/editor/sidebar/SideBarOptions";
import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";
import type { LightDark } from "@/theme/Theme";

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
  /** 编辑区选项 */
  editor?: EditorOptions;
  /** 预览区选项 */
  preview?: PreviewOptions;
  /** Transformer 解析选项 */
  transformer?: TransformerEngineOptions;
}
