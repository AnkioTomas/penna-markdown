import { ICON_MORE, resolveCommandIcon } from "./icons.js";
import type {
  ToolbarButtonItem,
  ToolbarContext,
  ToolbarItem,
  ToolbarItemBase,
  ToolbarMenuItem,
} from "./ToolbarItem.js";

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
  return item.type === "button" || item.type === undefined;
}

function resolveIcon(
  item: ToolbarItemBase & { command?: string; icon?: string },
): string {
  return item.icon ?? resolveCommandIcon(item.command);
}

function setBtnContent(
  btn: HTMLElement,
  item: ToolbarButtonItem,
  inMenu: boolean,
) {
  btn.replaceChildren();
  btn.insertAdjacentHTML("afterbegin", resolveIcon(item));
  btn.classList.add("has-icon");

  if (inMenu || item.label) {
    const span = document.createElement("span");
    span.className = "cherry-toolbar-btn-label";
    span.textContent = item.label;
    btn.append(span);
  }
}

function setMenuTriggerContent(
  trigger: HTMLElement,
  item: ToolbarMenuItem,
  nested: boolean,
) {
  trigger.replaceChildren();
  trigger.insertAdjacentHTML("afterbegin", resolveIcon(item));
  trigger.classList.add("has-icon");

  const span = document.createElement("span");
  span.className = "cherry-toolbar-btn-label";
  span.textContent = item.label;
  trigger.append(span);
  trigger.append(
    el("span", "cherry-toolbar-menu-caret", { "aria-hidden": "true" }),
  );

  trigger.classList.toggle("cherry-toolbar-menu-trigger--nested", nested);
}

export function renderButton(item: ToolbarButtonItem, inMenu: boolean) {
  const btn = el(
    "button",
    inMenu ? "cherry-toolbar-menu-item" : "cherry-toolbar-btn",
    {
      type: "button",
      "data-toolbar-id": item.id,
    },
  ) as HTMLButtonElement;
  if (item.title) btn.title = item.title;
  setBtnContent(btn, item, inMenu);
  return btn;
}

export function renderMenu(item: ToolbarMenuItem, nested: boolean) {
  const wrap = el(
    "div",
    nested ? "cherry-toolbar-submenu" : "cherry-toolbar-menu",
  );
  wrap.dataset.toolbarId = item.id;

  const trigger = el(
    "button",
    "cherry-toolbar-btn cherry-toolbar-menu-trigger",
    {
      type: "button",
      "aria-haspopup": "true",
      "aria-expanded": "false",
    },
  ) as HTMLButtonElement;
  if (item.title) trigger.title = item.title;
  setMenuTriggerContent(trigger, item, nested);

  const panel = el("div", "cherry-toolbar-menu-panel", { role: "menu" });

  if (item.title) {
    const header = el("div", "cherry-toolbar-menu-header");
    header.textContent = item.title;
    panel.append(header);
  }

  for (const child of item.children) appendToolbarItem(panel, child, true);

  wrap.append(trigger, panel);
  return wrap;
}

export function appendToolbarItem(
  parent: HTMLElement,
  item: ToolbarItem,
  inMenu: boolean,
) {
  if (item.type === "separator") {
    parent.append(
      el("span", inMenu ? "cherry-toolbar-menu-sep" : "cherry-toolbar-sep"),
    );
    return;
  }
  if (item.type === "menu") {
    parent.append(renderMenu(item, inMenu));
    return;
  }
  if (isButtonItem(item)) parent.append(renderButton(item, inMenu));
}

export function renderOverflowMenu(items: ToolbarItem[]) {
  const menu: ToolbarMenuItem = {
    id: "__overflow",
    type: "menu",
    label: "⋯",
    title: "更多",
    icon: ICON_MORE,
    children: items,
  };
  const menuEl = renderMenu(menu, false);
  menuEl.classList.add("cherry-toolbar-overflow-menu");
  return menuEl;
}

export interface RenderToolbarParams {
  groups: ToolbarItem[][];
  ctx: ToolbarContext;
}

export function renderToolbar(
  mount: HTMLElement,
  params: RenderToolbarParams,
): () => void {
  mount.classList.add("cherry-toolbar");
  mount.replaceChildren();

  let openPanel: HTMLElement | null = null;
  const closeOpenPanel = () => {
    if (!openPanel) return;
    mount
      .querySelectorAll(".is-open")
      .forEach((el) => el.classList.remove("is-open"));
    mount
      .querySelectorAll('.cherry-toolbar-menu-trigger[aria-expanded="true"]')
      .forEach((el) => el.setAttribute("aria-expanded", "false"));
    openPanel = null;
  };

  const onDocClick = (e: MouseEvent) => {
    if (!openPanel) return;
    const target = e.target as Node;
    // 如果点击在当前打开的最外层菜单内部，不关闭（按钮点击由委托处理关闭）
    const wrapper = openPanel.closest(".cherry-toolbar-menu");
    if (wrapper?.contains(target)) return;
    closeOpenPanel();
  };
  document.addEventListener("click", onDocClick);

  const itemMap = new Map<string, ToolbarItem>();
  const collectItems = (items: ToolbarItem[]) => {
    for (const item of items) {
      itemMap.set(item.id, item);
      if (item.type === "menu") collectItems(item.children);
    }
  };
  for (const group of params.groups) collectItems(group);

  const onToolbarClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;



    const trigger = target.closest(
      ".cherry-toolbar-menu-trigger",
    ) as HTMLButtonElement;
    if (trigger) {
      const wrap = trigger.closest(
        ".cherry-toolbar-menu, .cherry-toolbar-submenu",
      );
      if (wrap) {
        const isNested = wrap.classList.contains("cherry-toolbar-submenu");
        if (!isNested) {
          const open = wrap.classList.contains("is-open");
          closeOpenPanel();
          if (!open) {
            wrap.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
            openPanel = wrap.querySelector(".cherry-toolbar-menu-panel");
          }
        } else {
          // 二级菜单触发器点击：仅切换自身
          const open = wrap.classList.contains("is-open");
          if (open) {
            wrap.classList.remove("is-open");
            trigger.setAttribute("aria-expanded", "false");
          } else {
            // 关闭同级的其他二级菜单
            const parentPanel = wrap.closest(".cherry-toolbar-menu-panel");
            if (parentPanel) {
              parentPanel
                .querySelectorAll(".cherry-toolbar-submenu.is-open")
                .forEach((sib) => {
                  sib.classList.remove("is-open");
                  sib
                    .querySelector(".cherry-toolbar-menu-trigger")
                    ?.setAttribute("aria-expanded", "false");
                });
            }
            wrap.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
          }
        }
      }
      return;
    }

    const btn = target.closest("[data-toolbar-id]") as HTMLButtonElement;
    if (btn) {
      const id = btn.dataset.toolbarId;
      if (id) {
        const item = itemMap.get(id);
        if (item && isButtonItem(item)) {
          if (item.onClick) item.onClick(params.ctx);
          else if (item.command) params.ctx.execute(item.command, item.payload);
          params.ctx.focus();
          closeOpenPanel();
        }
      }
    }
  };

  mount.addEventListener("click", onToolbarClick);

  const scroll = el("div", "cherry-toolbar-scroll");

  for (const groupItems of params.groups) {
    const groupEl = el("div", "cherry-toolbar-group");
    const overflow: ToolbarItem[] = [];

    for (const item of groupItems) {
      if (item.mobileOverflow) overflow.push(item);
      appendToolbarItem(groupEl, item, false);

      if (item.mobileOverflow) {
        const lastEl = groupEl.lastElementChild;
        if (lastEl) lastEl.classList.add("cherry-toolbar-desktop-only");
      }
    }

    if (overflow.length) {
      groupEl.append(renderOverflowMenu(overflow));
    }
    scroll.append(groupEl);
  }



  mount.append(scroll);

  return () => {
    document.removeEventListener("click", onDocClick);
    mount.removeEventListener("click", onToolbarClick);
    closeOpenPanel();
    mount.replaceChildren();
    mount.classList.remove("cherry-toolbar");
  };
}
