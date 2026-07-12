import type { ToolbarItem, ToolbarContext } from "@/editor/toolbar/ToolbarItem";

export interface ToolbarOptions {
  /** 自定义/覆盖菜单项（同 id 覆盖默认项） */
  items?: ToolbarItem[];
  /** 自定义按钮全局点击回调（在 `ctx.execute` 之后旁路调用，不得替代命令分发） */
  onClick?: (id: string, ctx: ToolbarContext) => void;
}
