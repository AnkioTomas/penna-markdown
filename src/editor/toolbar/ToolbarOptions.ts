import type { ToolbarItem, ToolbarContext } from "@/editor/toolbar/ToolbarItem";

export interface ToolbarOptions {
  /**
   * 工具栏完整项目列表。
   * 传入后**整表替换**默认项（含空数组）；省略则使用 {@link DEFAULT_TOOLBAR_ITEMS}。
   * 基于默认项增删改时，请先展开默认表再调整，例如：
   * `[...DEFAULT_TOOLBAR_ITEMS.filter(i => i.id !== "ai"), myBtn]`
   */
  items?: ToolbarItem[];
  /** 自定义按钮全局点击回调（在 `ctx.execute` 之后旁路调用，不得替代命令分发） */
  onClick?: (id: string, ctx: ToolbarContext) => void;
}
