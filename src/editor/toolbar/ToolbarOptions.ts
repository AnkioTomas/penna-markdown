import type { ToolbarItem, ToolbarContext } from "@/editor/toolbar/ToolbarItem";
import type { CherryAIOptions } from "@/editor/CherryOptions";

export interface ToolbarOptions {
  /** 自定义/覆盖菜单项（同 id 覆盖默认项） */
  items?: ToolbarItem[];
  /** 自定义按钮全局点击回调 */
  onClick?: (id: string, ctx: ToolbarContext) => void;
  /** `false` 时不显示 AI 菜单；传入配置时启用（与 {@link CherryOptions.ai} 相同语义） */
  ai?: CherryAIOptions | false;
}
