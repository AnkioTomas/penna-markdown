import type { EditorLayoutMode } from "@/editor/Layout";
import { ICON_MORE } from "./icons.js";
import type {
  ToolbarButtonItem,
  ToolbarContext,
  ToolbarItem,
  ToolbarMenuItem,
} from "./ToolbarItem.js";

const LAYOUT_MODES: EditorLayoutMode[] = ["edit", "split", "preview"];
const LAYOUT_LABELS: Record<EditorLayoutMode, string> = {
  edit: "编辑",
  split: "双屏",
  preview: "预览",
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  attrs?: Record<string, string>,
) {
  const node = document.createElement(tag);
  node.className = className;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  }
  return node;
}

function isButtonItem(item: ToolbarItem): item is ToolbarButtonItem {
  return item.type !== "menu" && item.type !== "separator" && item.type !== "layout";
}

function setBtnContent(btn: HTMLElement, item: ToolbarButtonItem) {
  btn.replaceChildren();
  if (item.icon) {
    btn.insertAdjacentHTML("afterbegin", item.icon);
    btn.classList.add("has-icon");
  } else {
    btn.textContent = item.label;
  }
}

export interface RenderHandlers {
  ctx: ToolbarContext;
  onMenuOpen?: (panel: HTMLElement) => void;
  onMenuClose?: () => void;
}

export function renderButton(item: ToolbarButtonItem, inMenu: boolean, handlers: RenderHandlers) {
  const btn = el("button", inMenu ? "cherry-toolbar-menu-item" : "cherry-toolbar-btn", {
    type: "button",
    "data-toolbar-id": item.id,
  }) as HTMLButtonElement;
  if (item.title) btn.title = item.title;
  setBtnContent(btn, item);
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (item.onClick) item.onClick(handlers.ctx);
    else if (item.command) handlers.ctx.execute(item.command, item.payload);
    handlers.ctx.focus();
    handlers.onMenuClose?.();
  });
  return btn;
}

export function renderMenu(item: ToolbarMenuItem, nested: boolean, handlers: RenderHandlers) {
  const wrap = el("div", nested ? "cherry-toolbar-submenu" : "cherry-toolbar-menu");
  wrap.dataset.toolbarId = item.id;

  const trigger = el("button", "cherry-toolbar-btn cherry-toolbar-menu-trigger", {
    type: "button",
    "aria-haspopup": "true",
    "aria-expanded": "false",
  }) as HTMLButtonElement;
  if (item.title) trigger.title = item.title;
  if (item.icon) {
    trigger.insertAdjacentHTML("afterbegin", item.icon);
    trigger.classList.add("has-icon");
  } else {
    trigger.textContent = item.label;
  }
  trigger.append(el("span", "cherry-toolbar-menu-caret", { "aria-hidden": "true" }));

  const panel = el("div", "cherry-toolbar-menu-panel", { role: "menu" });
  for (const child of item.children) appendToolbarItem(panel, child, true, handlers);

  if (!nested) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = wrap.classList.contains("is-open");
      handlers.onMenuClose?.();
      if (!open) {
        wrap.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        handlers.onMenuOpen?.(wrap); // pass wrap instead of panel
      }
    });
  }

  wrap.append(trigger, panel);
  return wrap;
}

export function appendToolbarItem(
  parent: HTMLElement,
  item: ToolbarItem,
  inMenu: boolean,
  handlers: RenderHandlers,
) {
  if (item.type === "separator") {
    parent.append(el("span", inMenu ? "cherry-toolbar-menu-sep" : "cherry-toolbar-sep"));
    return;
  }
  if (item.type === "menu") {
    parent.append(renderMenu(item, inMenu, handlers));
    return;
  }
  if (isButtonItem(item)) parent.append(renderButton(item, inMenu, handlers));
}

export function renderOverflowMenu(items: ToolbarItem[], handlers: RenderHandlers) {
  const menu: ToolbarMenuItem = {
    id: "__overflow",
    type: "menu",
    label: "⋯",
    title: "更多",
    icon: ICON_MORE,
    children: items,
  };
  return renderMenu(menu, false, handlers);
}

export function renderLayoutGroup(ctx: ToolbarContext, group: HTMLElement) {
  for (const mode of LAYOUT_MODES) {
    const btn = el("button", "cherry-toolbar-btn cherry-toolbar-layout-btn", {
      type: "button",
      "data-layout": mode,
    }) as HTMLButtonElement;
    btn.textContent = LAYOUT_LABELS[mode];
    btn.classList.toggle("is-active", ctx.getLayout() === mode);
    btn.addEventListener("click", () => {
      ctx.setLayout(mode);
      group.querySelectorAll(".cherry-toolbar-layout-btn").forEach((el) => {
        el.classList.toggle("is-active", (el as HTMLButtonElement).dataset.layout === mode);
      });
    });
    ctx.onLayoutButton(mode, btn);
    group.append(btn);
  }
}

function createMobileQuery(breakpoint: number): MediaQueryList {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia(`(max-width: ${breakpoint}px)`);
  }
  return {
    matches: false,
    media: `(max-width: ${breakpoint}px)`,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as MediaQueryList;
}

export interface RenderToolbarParams {
  groups: ToolbarItem[][];
  ctx: ToolbarContext;
  layoutMode: EditorLayoutMode;
  mobileBreakpoint: number;
  layoutItem?: ToolbarItem;
}

export function renderToolbar(mount: HTMLElement, params: RenderToolbarParams): () => void {
  mount.classList.add("cherry-toolbar");
  mount.replaceChildren();

  let openPanel: HTMLElement | null = null;
  const closeOpenPanel = () => {
    if (!openPanel) return;
    openPanel
      .closest(".cherry-toolbar-menu, .cherry-toolbar-submenu")
      ?.classList.remove("is-open");
    openPanel
      .closest(".cherry-toolbar-menu, .cherry-toolbar-submenu")
      ?.querySelector(".cherry-toolbar-menu-trigger")
      ?.setAttribute("aria-expanded", "false");
    openPanel = null;
  };

  const onDocClick = (e: MouseEvent) => {
    if (!openPanel) return;
    if (openPanel.contains(e.target as Node)) return;
    closeOpenPanel();
  };
  document.addEventListener("click", onDocClick, true);

  const mobileQuery = createMobileQuery(params.mobileBreakpoint);
  const scroll = el("div", "cherry-toolbar-scroll");

  const paint = () => {
    closeOpenPanel();
    scroll.replaceChildren();
    const handlers: RenderHandlers = {
      ctx: params.ctx,
      onMenuOpen: (panel) => {
        openPanel = panel;
      },
      onMenuClose: closeOpenPanel,
    };
    const isMobile = mobileQuery.matches;

    for (const groupItems of params.groups) {
      const inline: ToolbarItem[] = [];
      const overflow: ToolbarItem[] = [];
      for (const item of groupItems) {
        if (isMobile && item.mobileOverflow) overflow.push(item);
        else inline.push(item);
      }
      const groupEl = el("div", "cherry-toolbar-group");
      for (const item of inline) appendToolbarItem(groupEl, item, false, handlers);
      if (isMobile && overflow.length) groupEl.append(renderOverflowMenu(overflow, handlers));
      scroll.append(groupEl);
    }

    if (params.layoutItem) {
      const layoutGroup = el("div", "cherry-toolbar-group cherry-toolbar-layout");
      renderLayoutGroup(params.ctx, layoutGroup);
      scroll.append(layoutGroup);
    }

    mount.replaceChildren(scroll);
  };

  paint();
  mobileQuery.addEventListener("change", paint);

  return () => {
    document.removeEventListener("click", onDocClick, true);
    mobileQuery.removeEventListener("change", paint);
    closeOpenPanel();
    mount.replaceChildren();
    mount.classList.remove("cherry-toolbar");
  };
}
