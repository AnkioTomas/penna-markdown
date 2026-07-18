/**
 * @file 脚注客户端交互
 * @module renderer/footnote/footnote
 *
 * 在预览挂载点做**事件委托**：悬停脚注引用时，在 `document.body` 显示浮层
 *（与 {@link ImageListener} 的 lightbox 同一挂载策略，避免预览区 overflow 裁切）。
 *
 * 浮层带 `penna-render` 复用富文本样式；主题 token 由 `.penna-footnote-tooltip`
 * 自身注入（见 `_footnote.scss` 的 `tooltip` mixin）。
 */

export class FootnoteListener {
  private readonly tooltip: HTMLElement;
  private readonly content: HTMLElement;
  private currentRef: HTMLAnchorElement | null = null;
  private readonly onMouseOverBound = (e: MouseEvent) => this.onMouseOver(e);
  private readonly onMouseOutBound = (e: MouseEvent) => this.onMouseOut(e);
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly mount: HTMLElement) {
    const doc = this.mount.ownerDocument || document;
    this.tooltip = doc.createElement("div");
    this.tooltip.className = "penna-footnote-tooltip penna-render";
    this.tooltip.setAttribute("role", "tooltip");

    this.content = doc.createElement("div");
    this.content.className = "penna-footnote-tooltip__body";

    const bridge = doc.createElement("div");
    bridge.className = "penna-footnote-tooltip__bridge";

    this.tooltip.append(this.content, bridge);

    this.mount.addEventListener("mouseover", this.onMouseOverBound);
    this.mount.addEventListener("mouseout", this.onMouseOutBound);
    this.tooltip.addEventListener("mouseover", this.onMouseOverBound);
    this.tooltip.addEventListener("mouseout", this.onMouseOutBound);
  }

  private syncTheme(): void {
    const dark =
      this.mount.classList.contains("penna-dark") ||
      !!this.mount.closest(".penna-dark");
    this.tooltip.classList.toggle("penna-dark", dark);
  }

  private attachTooltip(): void {
    const doc = this.mount.ownerDocument || document;
    if (this.tooltip.parentNode !== doc.body) {
      doc.body.appendChild(this.tooltip);
    }
  }

  private detachTooltip(): void {
    this.tooltip.remove();
  }

  private onMouseOver(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target || typeof target.closest !== "function") return;

    if (target.closest(".penna-footnote-tooltip")) {
      this.cancelHide();
      return;
    }

    const ref = target.closest(
      "sup.penna-footnote-ref a",
    ) as HTMLAnchorElement | null;
    if (!ref || !this.mount.contains(ref)) {
      this.scheduleHide();
      return;
    }

    this.cancelHide();
    if (this.currentRef === ref) return;

    const href = ref.getAttribute("href");
    if (!href || !href.startsWith("#footnote-")) return;

    const targetId = href.slice(1);
    const doc = this.mount.ownerDocument || document;
    const targetItem = doc.getElementById(targetId);
    if (!targetItem || !this.mount.contains(targetItem)) return;

    const clone = targetItem.cloneNode(true) as HTMLElement;
    clone.querySelector(".penna-footnote-backref")?.remove();

    this.currentRef = ref;
    this.syncTheme();
    this.content.innerHTML = clone.innerHTML;

    this.attachTooltip();
    const refRect = ref.getBoundingClientRect();
    this.tooltip.style.left = `${refRect.left + refRect.width / 2}px`;
    this.tooltip.style.top = `${refRect.top - 6}px`;

    requestAnimationFrame(() => {
      if (this.currentRef === ref) {
        this.tooltip.classList.add("is-visible");
      }
    });
  }

  private onMouseOut(e: MouseEvent) {
    const related = e.relatedTarget as HTMLElement | null;
    if (
      related &&
      typeof related.closest === "function" &&
      (related.closest(".penna-footnote-tooltip") ||
        related.closest("sup.penna-footnote-ref a"))
    ) {
      return;
    }
    this.scheduleHide();
  }

  private cancelHide(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private scheduleHide(): void {
    this.cancelHide();
    this.hideTimer = setTimeout(() => this.hideTooltip(), 80);
  }

  private hideTooltip(): void {
    this.hideTimer = null;
    if (!this.currentRef && !this.tooltip.classList.contains("is-visible")) {
      return;
    }
    this.tooltip.classList.remove("is-visible");
    this.currentRef = null;
    this.content.replaceChildren();

    setTimeout(() => {
      if (!this.currentRef) {
        this.detachTooltip();
      }
    }, 160);
  }

  /** 移除事件委托并清理 DOM */
  destroy(): void {
    this.cancelHide();
    this.mount.removeEventListener("mouseover", this.onMouseOverBound);
    this.mount.removeEventListener("mouseout", this.onMouseOutBound);
    this.tooltip.removeEventListener("mouseover", this.onMouseOverBound);
    this.tooltip.removeEventListener("mouseout", this.onMouseOutBound);
    this.detachTooltip();
    this.currentRef = null;
  }
}
