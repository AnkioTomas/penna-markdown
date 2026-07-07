import { el } from "../Cherry.js";
import { ICON_MORE, resolveCommandIcon } from "./icons.js";
import type {
  ToolbarButtonItem,
  ToolbarContext,
  ToolbarItem,
  ToolbarItemBase,
  ToolbarMenuItem,
} from "./ToolbarItem.js";

/**
 * 判断当前项目是否为按钮项。
 * 在 `type` 未指定时，默认视为普通按钮。
 */
function isButtonItem(item: ToolbarItem): item is ToolbarButtonItem {
  return item.type === "button" || item.type === undefined;
}

/**
 * 决定项目最终呈现的 SVG 图标。
 * 优先级：
 * 1. 项中显式定义的自定义 `item.icon`
 * 2. 根据关联 `item.command` 解析出来的系统默认图标
 * 3. 兜底通用配置图标 `ICON_EXT`
 */
function resolveIcon(
  item: ToolbarItemBase & { command?: string; icon?: string },
): string {
  return item.icon ?? resolveCommandIcon(item.command);
}

/**
 * 组装并渲染按钮的核心内部结构。
 * 注入 SVG 片段。如果项目处于菜单面板内，或自身配置了 `label` 文本，则追加文字节点。
 */
function setBtnContent(
  btn: HTMLElement,
  item: ToolbarButtonItem,
  inMenu: boolean,
) {
  btn.replaceChildren();
  btn.insertAdjacentHTML("afterbegin", resolveIcon(item));
  btn.classList.add("has-icon");

  if (inMenu || item.label) {
    const span = el("span", "cherry-toolbar-btn-label");
    span.textContent = item.label;
    btn.append(span);
  }
}

/**
 * 构建下拉菜单触发器按钮（Trigger）的内部结构。
 * 注入菜单名，并在末尾附加指示箭头的 caret 节点。
 */
function setMenuTriggerContent(
  trigger: HTMLElement,
  item: ToolbarMenuItem,
  nested: boolean,
) {
  trigger.replaceChildren();
  trigger.insertAdjacentHTML("afterbegin", resolveIcon(item));
  trigger.classList.add("has-icon");

  const span = el("span", "cherry-toolbar-btn-label");
  span.textContent = item.label;
  trigger.append(span);
  trigger.append(
    el("span", "cherry-toolbar-menu-caret", { "aria-hidden": "true" }),
  );

  trigger.classList.toggle("cherry-toolbar-menu-trigger--nested", nested);
}

/**
 * 创建并初始化一个普通按钮的 DOM 实例。
 * 附加 `data-toolbar-id` 用于事件委托中的快速回溯定位。
 */
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

/**
 * 创建并组装一个下拉菜单（Menu）DOM 树。
 * 支持嵌套二级菜单（Submenu）结构。
 */
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

/**
 * 路由并分发单个工具栏项的 DOM 节点追加逻辑。
 */
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

/**
 * 拼装专属于移动端/小屏幕下的“更多”折叠下拉菜单。
 */
export function renderOverflowMenu(items: ToolbarItem[]) {
  const menu: ToolbarMenuItem = {
    id: "__overflow",
    type: "menu",
    label: "更多",
    title: "更多",
    icon: ICON_MORE,
    children: items,
  };
  const menuEl = renderMenu(menu, false);
  menuEl.classList.add("cherry-toolbar-overflow-menu");
  return menuEl;
}

/**
 * 工具栏主渲染引擎。
 * 
 * 设计意图：
 * 1. 采用**全局事件委托**（Event Delegation）代理所有工具栏内部按钮点击，消除大量的局部事件监听器绑定。
 * 2. 建立 O(1) 的 Map 映射快速查找，避免在事件流中频繁进行 DOM 到树节点的递归搜索。
 * 3. 实现了健全的页面级点击收起（`onDocClick`）机制，点击菜单外部区域时自动闭合状态。
 * 4. 彻底解耦的生命周期管理：返回一个销毁函数（Cleanup），可安全注销全局/局部事件监听，防止内存泄露。
 */
export function renderToolbar(
  mount: HTMLElement,
  items: ToolbarItem[],
  ctx: ToolbarContext,
  onClick?: (id: string, ctx: ToolbarContext) => void,
): () => void {
  mount.classList.add("cherry-toolbar");
  mount.replaceChildren();

  let openPanel: HTMLElement | null = null;
  
  // 统一关闭当前打开的所有顶层和二级菜单面板
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

  // 页面级点击穿透闭合机制
  const onDocClick = (e: MouseEvent) => {
    if (!openPanel) return;
    const target = e.target as Node;
    const wrapper = openPanel.closest(".cherry-toolbar-menu");
    if (wrapper?.contains(target)) return;
    closeOpenPanel();
  };
  document.addEventListener("click", onDocClick);

  // 扁平化缓存项目树，用于在点击事件中实现 O(1) 高效查表
  const itemMap = new Map<string, ToolbarItem>();
  const collectItems = (itemsList: ToolbarItem[]) => {
    for (const item of itemsList) {
      itemMap.set(item.id, item);
      if (item.type === "menu") collectItems(item.children);
    }
  };
  collectItems(items);

  // 全局工具栏点击委托拦截器
  const onToolbarClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // 拦截菜单展开/折叠动作
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
          // 顶层菜单切换：关闭其他已打开的菜单，并打开当前菜单
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
            // 关闭同级的其他二级子菜单
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

    // 拦截普通按钮点击，分发至 onClick 属性、内置 command 或全局 onClick 处理器
    const btn = target.closest("[data-toolbar-id]") as HTMLButtonElement;
    if (btn) {
      const id = btn.dataset.toolbarId;
      if (id) {
        const item = itemMap.get(id);
        if (item && isButtonItem(item)) {
          if (item.onClick) {
            item.onClick(ctx);
          } else if (item.command) {
            ctx.execute(item.command, item.payload);
          } else if (onClick) {
            onClick(id, ctx);
          }
          ctx.focus();
          closeOpenPanel();
        }
      }
    }
  };

  mount.addEventListener("click", onToolbarClick);

  const scroll = el("div", "cherry-toolbar-scroll");

  const overflow: ToolbarItem[] = [];

  // 一维排列渲染主滚动条，并对标记了 mobileOverflow 的项目打上响应式隐藏类
  for (const item of items) {
    if (item.mobileOverflow) overflow.push(item);
    appendToolbarItem(scroll, item, false);

    if (item.mobileOverflow) {
      const lastEl = scroll.lastElementChild;
      if (lastEl) lastEl.classList.add("cherry-toolbar-desktop-only");
    }
  }

  // 若存在移动端折叠项，则在主轴末端追加“更多”菜单
  if (overflow.length) {
    scroll.append(renderOverflowMenu(overflow));
  }

  mount.append(scroll);

  // 返回清理函数，彻底规避内存泄漏与 DOM 孤立残留
  return () => {
    document.removeEventListener("click", onDocClick);
    mount.removeEventListener("click", onToolbarClick);
    closeOpenPanel();
    mount.replaceChildren();
    mount.classList.remove("cherry-toolbar");
  };
}
