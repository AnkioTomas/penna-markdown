import type { ToolbarItem } from "@/editor/toolbar/ToolbarItem";

export interface ToolbarOptions {
  /** 自定义/覆盖菜单项（同 id 覆盖默认项） */
  items?: ToolbarItem[];
  /** 顶层菜单 id 排序 */
  order?: string[];
  /** 子菜单 id 排序，key 为父 menu id */
  orderMap?: Record<string, string[]>;
  /** 分组排版：每组为 item id 数组，未出现在任何组内的 id 追加到末尾 */
  groups?: string[][];
  /** 是否显示布局切换器，默认 false */
  showLayoutSwitcher?: boolean;
}
