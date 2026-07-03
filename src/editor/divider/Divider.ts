import type { EditorLayoutMode } from "@/editor/Layout";
import type { Theme } from "@/theme/Theme";

const MIN_SPLIT = 0.15;
const MAX_SPLIT = 0.85;
const DEFAULT_SPLIT = 0.5;

function clampSplit(ratio: number): number {
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, ratio));
}

/** 分栏拖拽条：布局切换 + 左右宽度调整 */
export class Divider {
  private readonly bodyEl: HTMLElement;
  private readonly editorEl: HTMLElement;
  private readonly previewEl: HTMLElement;
  private readonly sidebarEl: HTMLElement | null;

  private mode: EditorLayoutMode = "split";
  private split = DEFAULT_SPLIT;
  private dragging = false;

  private readonly onPointerDown: (e: PointerEvent) => void;
  private readonly onPointerMove: (e: PointerEvent) => void;
  private readonly onPointerUp: (e: PointerEvent) => void;

  constructor(
    private readonly mount: HTMLElement,
    private readonly theme: Theme,
  ) {
    const body = mount.parentElement;
    const editor = mount.previousElementSibling;
    const preview = mount.nextElementSibling;

    if (
      !body?.classList.contains("cherry-body") ||
      !editor?.classList.contains("cherry-editor") ||
      !preview?.classList.contains("cherry-preview")
    ) {
      throw new Error("Divider 必须位于 .cherry-body 内，且夹在编辑区与预览区之间");
    }

    this.bodyEl = body;
    this.editorEl = editor as HTMLElement;
    this.previewEl = preview as HTMLElement;
    this.sidebarEl = body.querySelector(".cherry-sidebar");

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
      this.bodyEl.style.removeProperty("--cherry-split");
    }
  }

  private applySplit(): void {
    const pct = this.split * 100;
    this.bodyEl.style.setProperty("--cherry-split", `${pct}%`);
    this.mount.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  private startDrag(e: PointerEvent): void {
    if (this.mode !== "split" || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    this.dragging = true;
    this.mount.classList.add("is-dragging");
    this.mount.setPointerCapture(e.pointerId);
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
    document.addEventListener("pointercancel", this.onPointerUp);

    this.updateSplitFromPointer(e.clientX);
  }

  private moveDrag(e: PointerEvent): void {
    if (!this.dragging) return;
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

    this.theme.emit("editor:split", { split: this.split });
  }

  private updateSplitFromPointer(clientX: number): void {
    const bodyRect = this.bodyEl.getBoundingClientRect();
    const sidebarWidth = this.sidebarEl?.offsetWidth ?? 0;
    const dividerWidth = this.mount.offsetWidth;
    const track = bodyRect.width - sidebarWidth - dividerWidth;

    if (track <= 0) return;

    const offset = clientX - bodyRect.left - sidebarWidth;
    this.setSplit(offset / track);
  }
}
