import type { ToolbarOptions } from "@/editor/toolbar/ToolbarOptions";
import type { EventBus } from "@/core/event/EventBus";
import type { ToolbarContext } from "./ToolbarItem";
import { DEFAULT_TOOLBAR_ITEMS } from "@/editor/toolbar/defaults";
import type { ToolbarItem } from "@/editor/toolbar/ToolbarItem";
import { renderToolbar } from "@/editor/toolbar/renderToolbar";
import type { EditorCommandPayload } from "@/editor/events";

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
 * 解析工具栏项目列表。
 *
 * - 未传 `options.items`：使用 {@link DEFAULT_TOOLBAR_ITEMS}
 * - 传入 `options.items`（含空数组）：**整表替换**，不再与默认项合并
 *
 * @param options 工具栏配置及可选的自定义项目。
 * @param themes 可用主题白名单，来自 {@link CherryOptions.themes}。
 */
export function resolveToolbarItems(
  options?: ToolbarOptions,
  themes?: readonly string[],
): ToolbarItem[] {
  const source =
    options?.items !== undefined ? options.items : DEFAULT_TOOLBAR_ITEMS;
  return filterThemeMenu(
    source.map((item) => resolveChildren(item)),
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
