import type { EditorLayoutMode } from "@/editor/Layout";
import type { EditorOptions } from "@/editor/editor/EditorOptions";
import type { PreviewOptions } from "@/editor/preview/PreviewOptions";
import type { SideBarOptions } from "@/editor/sidebar/SideBarOptions";
import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";
import type { LightDark } from "@/theme/Theme";

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
  /** `false` 时隐藏侧边栏 */
  sidebar?: SideBarOptions | false;
  /** 编辑区选项 */
  editor?: EditorOptions;
  /** 预览区选项 */
  preview?: PreviewOptions;
  /** Transformer 解析选项 */
  transformer?: TransformerEngineOptions;
}
