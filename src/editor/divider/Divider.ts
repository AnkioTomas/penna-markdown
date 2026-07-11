import type { EditorLayoutMode } from "@/editor/Layout";
import type { EventBus } from "@/core/event/EventBus";
import type { StorageAPI } from "@/core/StorageAPI";
import { createDefaultStorage } from "@/core/StorageAPI";

const MIN_SPLIT = 0.15;
const MAX_SPLIT = 0.85;
const DEFAULT_SPLIT = 0.5;

/** 分栏比例在本地存储中使用的键名 */
export const SPLIT_STORAGE_KEY = "cherry-editor-split";

/**
 * 将分栏比例约束在可拖拽的有效范围内。
 *
 * @param ratio 待约束的编辑区宽度比例。
 * @returns 位于最小值和最大值之间的比例。
 */
function clampSplit(ratio: number): number {
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, ratio));
}

/**
 * 从存储读取上次使用的分栏比例。
 *
 * 值缺失或非法时回退到默认比例。
 *
 * @param storage 键值存储 API。
 * @returns 有效的分栏比例。
 */
function readStoredSplit(storage: StorageAPI): number {
  const raw = storage.getItem(SPLIT_STORAGE_KEY);
  if (raw == null) return DEFAULT_SPLIT;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? clampSplit(value) : DEFAULT_SPLIT;
}

/** 分栏拖拽条：布局切换 + 左右宽度调整 */
export class Divider {
  private readonly bodyEl: HTMLElement;
  private readonly sidebarEl: HTMLElement | null;

  private mode: EditorLayoutMode = "split";
  private split: number;
  private dragging = false;
  private moved = false;

  private readonly onPointerDown = (e: PointerEvent) => this.startDrag(e);
  private readonly onPointerMove = (e: PointerEvent) => this.moveDrag(e);
  private readonly onPointerUp = (e: PointerEvent) => this.endDrag(e);

  /**
   * 创建分栏拖拽条并初始化布局状态。
   *
   * @param mount 承载拖拽条的 DOM 元素。
   * @param eventBus 用于发布布局和分栏比例变化的事件总线。
   * @param storage 用于持久化分栏比例的存储 API。
   */
  constructor(
    private readonly mount: HTMLElement,
    private readonly eventBus: EventBus,
    private readonly storage: StorageAPI = createDefaultStorage(),
  ) {
    if (!mount.parentElement) {
      throw new Error("Divider 必须挂载在有效的 DOM 树中");
    }

    this.split = readStoredSplit(this.storage);
    this.bodyEl = mount.parentElement;
    this.sidebarEl = this.bodyEl.querySelector(".cherry-sidebar");

    mount.setAttribute("role", "separator");
    mount.setAttribute("aria-orientation", "vertical");
    mount.setAttribute("aria-valuemin", String(MIN_SPLIT * 100));
    mount.setAttribute("aria-valuemax", String(MAX_SPLIT * 100));

    this.onPointerDown = (e) => this.startDrag(e);
    this.onPointerMove = (e) => this.moveDrag(e);
    this.onPointerUp = (e) => this.endDrag(e);

    mount.addEventListener("pointerdown", this.onPointerDown);

    this.applyLayout();
  }

  /** 获取当前编辑器布局模式。 */
  getLayout(): EditorLayoutMode {
    return this.mode;
  }

  /**
   * 设置编辑器布局并通知订阅者。
   *
   * @param mode 要应用的布局模式。
   */
  setLayout(mode: EditorLayoutMode): void {
    if (this.mode === mode) return;
    const prev = this.mode;
    this.mode = mode;
    this.applyLayout();
    this.eventBus.emit("editor:layout", { mode, prev });
  }

  /** 获取编辑区在双栏模式下所占的宽度比例。 */
  getSplit(): number {
    return this.split;
  }

  /**
   * 设置编辑区宽度比例，并在双栏模式下立即更新样式。
   *
   * @param ratio 编辑区相对于可用轨道宽度的目标比例。
   */
  setSplit(ratio: number): void {
    this.split = clampSplit(ratio);
    if (this.mode === "split") this.applySplit();
  }

  /** 结束可能进行中的拖拽并注销 DOM 事件监听。 */
  destroy(): void {
    this.endDrag();
    this.mount.removeEventListener("pointerdown", this.onPointerDown);
  }

  /** 将当前布局模式同步到容器 CSS 类和分栏样式。 */
  private applyLayout(): void {
    this.bodyEl.classList.remove(
      "cherry-body--split",
      "cherry-body--edit",
      "cherry-body--preview",
    );
    this.bodyEl.classList.add(`cherry-body--${this.mode}`);
    this.mount.classList.toggle("is-disabled", this.mode !== "split");

    if (this.mode === "split") {
      this.applySplit();
    } else {
      this.bodyEl.style.removeProperty("--cherry-editor-ratio");
      this.bodyEl.style.removeProperty("--cherry-preview-ratio");
    }
  }

  /** 利用 Flex 比例完美分摊剩余空间（无需 ResizeObserver） */
  private applySplit(): void {
    const editorRatio = Math.round(this.split * 10000);
    const previewRatio = Math.round((1 - this.split) * 10000);

    this.bodyEl.style.setProperty("--cherry-editor-ratio", String(editorRatio));
    this.bodyEl.style.setProperty(
      "--cherry-preview-ratio",
      String(previewRatio),
    );
    this.mount.setAttribute(
      "aria-valuenow",
      String(Math.round(this.split * 100)),
    );
  }

  /**
   * 计算拖拽可用轨道及侧边栏的尺寸。
   *
   * @returns 容器总宽度、可用轨道宽度和可见侧边栏宽度。
   */
  private getTrackMetrics(): {
    bodyWidth: number;
    track: number;
    sidebarWidth: number;
  } {
    const bodyWidth = this.bodyEl.getBoundingClientRect().width;
    const sidebarWidth =
      this.sidebarEl && this.sidebarEl.offsetParent !== null
        ? this.sidebarEl.offsetWidth
        : 0;
    const dividerWidth = this.mount.offsetWidth;
    const track = bodyWidth - sidebarWidth - dividerWidth;
    return { bodyWidth, track, sidebarWidth };
  }

  /**
   * 开始主指针拖拽，并注册文档级移动和结束监听。
   *
   * @param e 触发拖拽的指针事件。
   */
  private startDrag(e: PointerEvent): void {
    if (this.mode !== "split" || e.button !== 0) return;
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
   * 根据指针当前位置更新分栏比例。
   *
   * @param e 当前指针移动事件。
   */
  private moveDrag(e: PointerEvent): void {
    if (!this.dragging) return;
    this.moved = true;
    this.updateSplitFromPointer(e.clientX);
  }

  /**
   * 结束拖拽、释放指针捕获，并在位置变更后持久化比例。
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
      this.persistSplit();
      this.eventBus.emit("editor:split", { split: this.split });
    }
  }

  /** 将当前分栏比例写入存储。 */
  private persistSplit(): void {
    this.storage.setItem(SPLIT_STORAGE_KEY, String(this.split));
  }

  /**
   * 将页面横坐标换算为分栏比例并应用。
   *
   * @param clientX 指针相对视口的横坐标。
   */
  private updateSplitFromPointer(clientX: number): void {
    const bodyRect = this.bodyEl.getBoundingClientRect();
    const { track, sidebarWidth } = this.getTrackMetrics();
    if (track <= 0) return;

    const offset = clientX - bodyRect.left - sidebarWidth;
    this.setSplit(offset / track);
  }
}
