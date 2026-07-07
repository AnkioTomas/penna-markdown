import type { EditorLayoutMode } from "@/editor/Layout";
import type { Theme } from "@/theme/Theme";

const MIN_SPLIT = 0.15;
const MAX_SPLIT = 0.85;
const DEFAULT_SPLIT = 0.5;
const SPLIT_STORAGE_KEY = "cherry-editor-split";

function clampSplit(ratio: number): number {
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, ratio));
}

function readStoredSplit(): number {
  try {
    const raw = localStorage.getItem(SPLIT_STORAGE_KEY);
    if (raw == null) return DEFAULT_SPLIT;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? clampSplit(value) : DEFAULT_SPLIT;
  } catch {
    return DEFAULT_SPLIT;
  }
}

/** 分栏拖拽条：布局切换 + 左右宽度调整 */
export class Divider {
  private readonly bodyEl: HTMLElement;
  private readonly sidebarEl: HTMLElement | null;

  private mode: EditorLayoutMode = "split";
  private split = readStoredSplit();
  private dragging = false;
  private moved = false;

  private readonly onPointerDown = (e: PointerEvent) => this.startDrag(e);
  private readonly onPointerMove = (e: PointerEvent) => this.moveDrag(e);
  private readonly onPointerUp = (e: PointerEvent) => this.endDrag(e);

  constructor(
    private readonly mount: HTMLElement,
    private readonly theme: Theme,
  ) {
    if (!mount.parentElement) {
      throw new Error("Divider 必须挂载在有效的 DOM 树中");
    }

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

  getLayout(): EditorLayoutMode {
    return this.mode;
  }

  setLayout(mode: EditorLayoutMode): void {
    if (this.mode === mode) return;
    const prev = this.mode;
    this.mode = mode;
    this.applyLayout();
    this.theme.emit("editor:layout", { mode, prev });
  }

  getSplit(): number {
    return this.split;
  }

  setSplit(ratio: number): void {
    this.split = clampSplit(ratio);
    if (this.mode === "split") this.applySplit();
  }

  destroy(): void {
    this.endDrag();
    this.mount.removeEventListener("pointerdown", this.onPointerDown);
  }

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
    this.bodyEl.style.setProperty("--cherry-preview-ratio", String(previewRatio));
    this.mount.setAttribute("aria-valuenow", String(Math.round(this.split * 100)));
  }

  private getTrackMetrics(): { bodyWidth: number; track: number; sidebarWidth: number } {
    const bodyWidth = this.bodyEl.getBoundingClientRect().width;
    const sidebarWidth =
      this.sidebarEl && this.sidebarEl.offsetParent !== null
        ? this.sidebarEl.offsetWidth
        : 0;
    const dividerWidth = this.mount.offsetWidth;
    const track = bodyWidth - sidebarWidth - dividerWidth;
    return { bodyWidth, track, sidebarWidth };
  }

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

  private moveDrag(e: PointerEvent): void {
    if (!this.dragging) return;
    this.moved = true;
    this.updateSplitFromPointer(e.clientX);
  }

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
      this.theme.emit("editor:split", { split: this.split });
    }
  }

  private persistSplit(): void {
    try {
      localStorage.setItem(SPLIT_STORAGE_KEY, String(this.split));
    } catch {
      // 忽略隐私模式等写入失败
    }
  }

  private updateSplitFromPointer(clientX: number): void {
    const bodyRect = this.bodyEl.getBoundingClientRect();
    const { track, sidebarWidth } = this.getTrackMetrics();
    if (track <= 0) return;

    const offset = clientX - bodyRect.left - sidebarWidth;
    this.setSplit(offset / track);
  }
}
