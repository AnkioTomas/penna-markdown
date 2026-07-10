/**
 * @file 代码块客户端交互
 * @module renderer/code/code
 *
 * 在预览挂载点做**事件委托**，处理 `enhancedCode` block parser 渲染出的按钮：
 *
 * | 选择器 | 行为 |
 * | ------ | ---- |
 * | `button.cherry-copy-code-button` | 复制 `code[data-cherry-code]` 文本 |
 * | `button.cherry-code-block__expand` | 切换 `.cherry-code-block__panel--collapsed` |
 *
 * 委托绑定在 mount 上，增量 reconcile 替换子节点后无需重新挂载监听。
 *
 * DOM 结构与样式由 `enhancedCode` parser + 主题 SCSS 产出，本模块不修改 HTML。
 */

import { copyText } from "@/renderer/code/copy";

/**
 * 预览区代码块交互监听器。
 *
 * 构造时注册 `click` 委托；{@link destroy} 时移除。
 */
export class CodeListener {
  private readonly onClickBound = (e: MouseEvent) => this.onClick(e);

  /**
   * @param render 预览挂载点（与 {@link Renderer} 的 `mount` 相同）
   */
  constructor(private readonly render: HTMLElement) {
    this.render.addEventListener("click", this.onClickBound);
  }

  /** 委托入口：匹配展开或复制按钮后分发 */
  private onClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    const expand = target.closest("button.cherry-code-block__expand");
    if (expand) {
      e.preventDefault();
      this.handleExpand(expand as HTMLButtonElement);
      return;
    }

    const copy = target.closest("button.cherry-copy-code-button");
    if (copy) {
      this.handleCopy(copy as HTMLButtonElement);
      return;
    }
  }

  /**
   * 复制同 panel 内 `code[data-cherry-code]` 的 `textContent`。
   *
   * 成功后切换 `is-copied` 与 `aria-label`，2s 后恢复。
   */
  async handleCopy(btn: HTMLButtonElement) {
    const doc = btn.ownerDocument;
    const panel = btn.closest(".cherry-code-block__panel");
    if (!panel) return;
    const codeEl = panel.querySelector<HTMLElement>("code[data-cherry-code]");
    if (!codeEl) return;
    const code = codeEl.textContent;

    try {
      await copyText(code, doc);
    } catch {
      return;
    }

    const copiedLabel = btn.getAttribute("data-copied") || "已复制";
    const originalLabel = btn.getAttribute("aria-label") || "复制代码";
    btn.classList.add("is-copied");
    btn.setAttribute("aria-label", copiedLabel);

    const timer = doc.defaultView?.setTimeout ?? setTimeout;
    timer(() => {
      btn.classList.remove("is-copied");
      btn.setAttribute("aria-label", originalLabel);
    }, 2000);
  }

  /**
   * 切换可折叠代码块 `.cherry-code-block__panel--collapsed`。
   *
   * 同步 `aria-expanded` 与 `.cherry-code-block__expand-label` 文案。
   */
  handleExpand(btn: HTMLButtonElement) {
    const panel = btn.closest(".cherry-code-block__panel--collapsible");
    if (!panel) return;

    const label = btn.querySelector(".cherry-code-block__expand-label");
    const isCollapsed = panel.classList.toggle(
      "cherry-code-block__panel--collapsed",
    );
    btn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    if (label) {
      label.textContent = isCollapsed ? "展开代码" : "收起代码";
    }
  }

  /** 移除 mount 上的 click 委托 */
  destroy() {
    this.render.removeEventListener("click", this.onClickBound);
  }
}
