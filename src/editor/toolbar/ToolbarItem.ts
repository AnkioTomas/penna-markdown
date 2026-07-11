import type { EditorCommand } from "@/editor/commands/index";
import type { EventBus } from "@/core/event/EventBus";

export interface ToolbarContext {
  eventBus: EventBus;
  execute(command: EditorCommand | string, payload?: unknown): void;
  focus(): void;
}

export type ToolbarItemType = "button" | "menu" | "separator";

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

export type ToolbarItem =
  ToolbarButtonItem | ToolbarMenuItem | ToolbarSeparatorItem;
