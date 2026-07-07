import { DEFAULT_TOOLBAR_GROUPS, DEFAULT_TOOLBAR_ITEMS } from "./defaults.js";
import type { ToolbarItem, ToolbarMenuItem } from "./ToolbarItem.js";
import type { ToolbarOptions } from "./ToolbarOptions.js";

export interface ToolbarGroup {
  items: ToolbarItem[];
}

function sortByOrder<T extends { id: string }>(items: T[], order?: string[]): T[] {
  if (!order?.length) return items;
  const map = new Map(items.map((i) => [i.id, i]));
  const sorted: T[] = [];
  for (const id of order) {
    const item = map.get(id);
    if (item) {
      sorted.push(item);
      map.delete(id);
    }
  }
  for (const item of map.values()) sorted.push(item);
  return sorted;
}

function mergeMenuChildren(base: ToolbarMenuItem, patch: ToolbarMenuItem): ToolbarMenuItem {
  const childMap = new Map(base.children.map((c) => [c.id, c]));
  for (const child of patch.children) childMap.set(child.id, child);
  return { ...base, ...patch, children: Array.from(childMap.values()) };
}

function mergeItem(base: ToolbarItem, patch: ToolbarItem): ToolbarItem {
  if (base.type === "menu" && patch.type === "menu") return mergeMenuChildren(base, patch);
  return { ...base, ...patch } as ToolbarItem;
}

function mergeItems(defaults: ToolbarItem[], custom?: ToolbarItem[]): ToolbarItem[] {
  if (!custom?.length) return defaults.map((i) => ({ ...i }));
  const map = new Map(defaults.map((i) => [i.id, { ...i }]));
  for (const item of custom) {
    if (item.hidden) {
      map.delete(item.id);
      continue;
    }
    const existing = map.get(item.id);
    map.set(item.id, existing ? mergeItem(existing, item) : item);
  }
  return Array.from(map.values());
}

function resolveChildren(item: ToolbarItem, orderMap?: Record<string, string[]>): ToolbarItem {
  if (item.type !== "menu") return item;
  const children = sortByOrder(item.children, orderMap?.[item.id]).filter((c) => !c.hidden);
  return { ...item, children: children.map((c) => resolveChildren(c, orderMap)) };
}

/** 合并默认项、应用排序并过滤 hidden。 */
export function resolveToolbarItems(options?: ToolbarOptions): ToolbarItem[] {
  const merged = mergeItems(DEFAULT_TOOLBAR_ITEMS, options?.items);
  const ordered = sortByOrder(merged, options?.order);
  return ordered
    .map((item) => resolveChildren(item, options?.orderMap))
    .filter((item) => !item.hidden);
}

/** 按 groups 将顶层项分组；未出现在任何组内的 id 追加到最后一组（不含 layout）。 */
export function groupToolbarItems(
  items: ToolbarItem[],
  groups?: string[][],
): ToolbarItem[][] {
  const main = items.filter((i) => i.type !== "layout");
  const spec = groups ?? DEFAULT_TOOLBAR_GROUPS;
  const map = new Map(main.map((i) => [i.id, i]));
  const grouped: ToolbarItem[][] = [];
  const used = new Set<string>();

  for (const ids of spec) {
    const row: ToolbarItem[] = [];
    for (const id of ids) {
      const item = map.get(id);
      if (item) {
        row.push(item);
        used.add(id);
      }
    }
    if (row.length) grouped.push(row);
  }

  const rest = main.filter((i) => !used.has(i.id));
  if (rest.length) {
    if (grouped.length) grouped[grouped.length - 1]!.push(...rest);
    else grouped.push(rest);
  }

  return grouped.length ? grouped : [main];
}

/** 解析分组后的工具栏项；layout 始终在最后独立成组。 */
export function resolveToolbarGroups(options?: ToolbarOptions): ToolbarGroup[] {
  const items = resolveToolbarItems(options);
  const layout = items.find((i) => i.type === "layout");
  const rows = groupToolbarItems(items, options?.groups ?? DEFAULT_TOOLBAR_GROUPS);
  const result: ToolbarGroup[] = rows.map((row) => ({ items: row }));
  if (layout) result.push({ items: [layout] });
  return result;
}
