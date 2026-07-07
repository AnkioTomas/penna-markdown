import { DEFAULT_TOOLBAR_ITEMS } from "./defaults.js";
import type { ToolbarItem } from "./ToolbarItem.js";
import type { ToolbarOptions } from "./ToolbarOptions.js";

/**
 * 合并系统默认配置项与用户自定义配置项。
 * 
 * 合并策略：
 * 1. 采用 shallow merge（浅层覆盖）：同名 id 项以用户自定义项（custom）直接替换默认项（defaults）。
 * 2. 显式隐藏：若用户传入的自定义项带有 `hidden: true` 标记，则在此阶段直接删除该项，不参与后续渲染。
 */
function mergeItems(
  defaults: ToolbarItem[],
  custom?: ToolbarItem[],
): ToolbarItem[] {
  if (!custom?.length) return defaults.map((i) => ({ ...i }));
  const map = new Map(defaults.map((i) => [i.id, { ...i }]));
  for (const item of custom) {
    if (item.hidden) {
      map.delete(item.id);
      continue;
    }
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

/**
 * 深度递归解析菜单项的子树节点，过滤掉隐藏（`hidden`）的子树节点。
 */
function resolveChildren(item: ToolbarItem): ToolbarItem {
  if (item.type !== "menu") return item;
  const children = item.children.filter((c) => !c.hidden);
  return {
    ...item,
    children: children.map((c) => resolveChildren(c)),
  };
}

/**
 * 合并默认项与自定义项，递归清理隐藏节点，输出一维 ToolbarItem 列表。
 */
export function resolveToolbarItems(options?: ToolbarOptions): ToolbarItem[] {
  const merged = mergeItems(DEFAULT_TOOLBAR_ITEMS, options?.items);
  return merged
    .map((item) => resolveChildren(item))
    .filter((item) => !item.hidden);
}
