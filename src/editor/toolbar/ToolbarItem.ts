import type { EditorCommand } from "../commands.js";
import type { EditorLayoutMode } from "../Layout.js";

export interface ToolbarContext {
  execute(command: EditorCommand | string, payload?: unknown): void;
  focus(): void;
  setLayout(mode: EditorLayoutMode): void;
  getLayout(): EditorLayoutMode;
  onLayoutButton(mode: EditorLayoutMode, btn: HTMLButtonElement): void;
}

export type ToolbarItemType = "button" | "menu" | "separator" | "layout";

export interface ToolbarItemBase {
  /** 全局唯一 id，用于排序与覆盖 */
  id: string;
  type?: ToolbarItemType;
  /** 不渲染 */
  hidden?: boolean;
  /** 移动端收进「更多」菜单 */
  mobileOverflow?: boolean;
  /** SVG innerHTML，优先于 label */
  icon?: string;
  /** 声明所属分组（groups 未配置时的 fallback） */
  group?: string;
}

export interface ToolbarButtonItem extends ToolbarItemBase {
  type?: "button";
  label: string;
  title?: string;
  command?: EditorCommand | string;
  payload?: unknown;
  onClick?: (ctx: ToolbarContext) => void;
}

export interface ToolbarMenuItem extends ToolbarItemBase {
  type: "menu";
  label: string;
  title?: string;
  children: ToolbarItem[];
}

export interface ToolbarSeparatorItem extends ToolbarItemBase {
  type: "separator";
}

export interface ToolbarLayoutItem extends ToolbarItemBase {
  type: "layout";
}

export type ToolbarItem =
  | ToolbarButtonItem
  | ToolbarMenuItem
  | ToolbarSeparatorItem
  | ToolbarLayoutItem;
