import type { StorageAPI } from "@/core/StorageAPI";

const MIN_WIDTH = 160;

/** 未配置 `sidebar.maxWidth` 时的侧栏宽度上限（px） */
export const DEFAULT_SIDEBAR_MAX_WIDTH = 300;

/** 侧栏宽度在本地存储中使用的键名 */
export const SIDEBAR_WIDTH_STORAGE_KEY = "penna-sidebar-width";

/** 侧栏宽度拖拽条：把 `--penna-sidebar-width` 写到侧栏元素上 */
export class SideBarResizer {
  private readonly maxWidth: number;
  private width: number;
  private dragging = false;
  private moved = false;

  private readonly onPointerDown = (e: PointerEvent) => this.startDrag(e);
  private readonly onPointerMove = (e: PointerEvent) => this.moveDrag(e);
  private readonly onPointerUp = (e: PointerEvent) => this.endDrag(e);

  /**
   * 创建侧栏拖拽条并恢复上次的宽度。
   *
   * @param mount 承载拖拽条的 DOM 元素。
   * @param sidebarEl 被调整宽度的侧栏元素。
   * @param storage 用于持久化侧栏宽度的存储 API。
   * @param maxWidth 侧栏宽度上限（px），同时作为初始宽度。
   */
  constructor(
    private readonly mount: HTMLElement,
    private readonly sidebarEl: HTMLElement,
    private readonly storage: StorageAPI,
    maxWidth: number = DEFAULT_SIDEBAR_MAX_WIDTH,
  ) {
    this.maxWidth = maxWidth;
    this.width = this.clamp(this.readStoredWidth() ?? maxWidth);

    mount.setAttribute("role", "separator");
    mount.setAttribute("aria-orientation", "vertical");
    mount.setAttribute("aria-valuemin", String(Math.min(MIN_WIDTH, maxWidth)));
    mount.setAttribute("aria-valuemax", String(maxWidth));
    mount.addEventListener("pointerdown", this.onPointerDown);

    this.applyWidth();
  }

  /** 获取当前侧栏宽度（px）。 */
  getWidth(): number {
    return this.width;
  }

  /**
   * 设置侧栏宽度并立即更新样式。
   *
   * @param width 目标宽度（px），超出范围时被约束。
   */
  setWidth(width: number): void {
    this.width = this.clamp(width);
    this.applyWidth();
  }

  /** 结束可能进行中的拖拽并注销 DOM 事件监听。 */
  destroy(): void {
    this.endDrag();
    this.mount.removeEventListener("pointerdown", this.onPointerDown);
  }

  /**
   * 将宽度约束在可拖拽的有效范围内。
   *
   * @param width 待约束的宽度（px）。
   * @returns 位于最小宽度和上限之间的宽度。
   */
  private clamp(width: number): number {
    return Math.min(this.maxWidth, Math.max(MIN_WIDTH, width));
  }

  /**
   * 从存储读取上次使用的侧栏宽度。
   *
   * @returns 合法的宽度值，缺失或非法时返回 `null`。
   */
  private readStoredWidth(): number | null {
    const raw = this.storage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (raw == null) return null;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : null;
  }

  /** 把当前宽度写入侧栏元素的 CSS 变量与 ARIA 属性。 */
  private applyWidth(): void {
    this.sidebarEl.style.setProperty(
      "--penna-sidebar-width",
      `${Math.round(this.width)}px`,
    );
    this.mount.setAttribute("aria-valuenow", String(Math.round(this.width)));
  }

  /**
   * 开始主指针拖拽，并注册文档级移动和结束监听。
   *
   * @param e 触发拖拽的指针事件。
   */
  private startDrag(e: PointerEvent): void {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    this.dragging = true;
    this.moved = false;
    this.mount.classList.add("is-dragging");
    this.mount.setPointerCapture(e.pointerId);
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
    document.addEventListener("pointercancel", this.onPointerUp);
  }

  /**
   * 根据指针当前位置更新侧栏宽度。
   *
   * @param e 当前指针移动事件。
   */
  private moveDrag(e: PointerEvent): void {
    if (!this.dragging) return;
    this.moved = true;
    this.setWidth(e.clientX - this.sidebarEl.getBoundingClientRect().left);
  }

  /**
   * 结束拖拽、释放指针捕获，并在宽度变更后持久化。
   *
   * @param e 可选的结束指针事件，用于释放对应的指针捕获。
   */
  private endDrag(e?: PointerEvent): void {
    if (!this.dragging) return;

    this.dragging = false;
    this.mount.classList.remove("is-dragging");
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerup", this.onPointerUp);
    document.removeEventListener("pointercancel", this.onPointerUp);

    if (e?.pointerId != null && this.mount.hasPointerCapture(e.pointerId)) {
      this.mount.releasePointerCapture(e.pointerId);
    }

    if (this.moved) {
      this.storage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(this.width));
    }
  }
}
