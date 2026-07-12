import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { EventBus } from "@/core/event/EventBus";
import type { ToolbarContext } from "./ToolbarItem";
import { DEFAULT_TOOLBAR_ITEMS } from "@/editor/toolbar/defaults";
import type { ToolbarItem } from "@/editor/toolbar/ToolbarItem";
import { renderToolbar } from "@/editor/toolbar/renderToolbar";
import type { EditorCommandPayload } from "@/editor/events";

/**
 * 合并系统默认配置项与用户自定义配置项。
 *
 * 合并策略：采用 shallow merge（浅层覆盖），同名 id 项以用户自定义项（custom）直接替换默认项（defaults）。
 */
function mergeItems(
  defaults: ToolbarItem[],
  custom?: ToolbarItem[],
): ToolbarItem[] {
  if (!custom?.length) return defaults.map((i) => ({ ...i }));
  const map = new Map(defaults.map((i) => [i.id, { ...i }]));
  for (const item of custom) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

/** 深度递归解析菜单项的子树节点。 */
function resolveChildren(item: ToolbarItem): ToolbarItem {
  if (item.type !== "menu") return item;
  return {
    ...item,
    children: item.children.map((c) => resolveChildren(c)),
  };
}

/** 按 themes 白名单过滤主题子菜单。 */
function filterThemeMenu(
  items: ToolbarItem[],
  themes?: readonly string[],
): ToolbarItem[] {
  if (!themes?.length) return items;
  const allowed = new Set(themes.map((id) => `theme-${id}`));
  return items.map((item) => {
    if (item.id !== "themeMenu" || item.type !== "menu") return item;
    return {
      ...item,
      children: item.children.filter((c) => allowed.has(c.id)),
    };
  });
}

/**
 * 合并默认项与自定义项，输出顶层 ToolbarItem 列表。
 *
 * @param options 工具栏配置及可选的自定义项目。
 * @param themes 可用主题白名单，来自 {@link CherryOptions.themes}。
 */
export function resolveToolbarItems(
  options?: ToolbarOptions,
  themes?: readonly string[],
): ToolbarItem[] {
  const merged = mergeItems(DEFAULT_TOOLBAR_ITEMS, options?.items);
  return filterThemeMenu(
    merged.map((item) => resolveChildren(item)),
    themes,
  );
}

/** 解析工具栏配置、转发按钮命令并管理渲染生命周期。 */
export class Toolbar {
  private cleanup: (() => void) | null = null;

  /**
   * 创建并渲染工具栏。
   *
   * @param mount 承载工具栏的 DOM 元素。
   * @param eventBus 用于发布编辑器命令的事件总线。
   * @param options 工具栏项目和点击行为配置。
   * @param themes 可用主题白名单，来自 {@link CherryOptions.themes}。
   * @param focus 可选的编辑器聚焦函数，在执行命令后调用。
   */
  constructor(
    mount: HTMLElement,
    eventBus: EventBus,
    options: ToolbarOptions,
    themes?: readonly string[],
    focus?: () => void,
  ) {
    const ctx: ToolbarContext = {
      eventBus,
      execute: (id) => {
        const cmd: EditorCommandPayload = { command: id };
        eventBus.emit("editor:command", cmd);
        focus?.();
      },
      focus: () => focus?.(),
    };

    const items = resolveToolbarItems(options, themes);

    this.cleanup = renderToolbar(mount, items, ctx, options.onClick);
  }

  /** 执行渲染清理函数并释放工具栏事件监听。 */
  destroy(): void {
    this.cleanup?.();
    this.cleanup = null;
  }
}
