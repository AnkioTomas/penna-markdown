import type { EditorLayoutMode } from "@/editor/Layout";
import type { Theme } from "@/theme/Theme";
import type { Editor } from "@/editor/editor/Editor";
import {
  watchPreviewLayout,
  type PreviewLayoutWatcher,
} from "./layoutWatch.js";
import {
  applyScrollRatio,
  DEFAULT_SCROLL_ANCHOR_RATIO,
  measureSyncAnchors,
  previewScrollTopForSourceLine,
  sourceLineForPreviewScroll,
  type MeasuredAnchor,
} from "./mapScroll.js";

type ScrollLock = "editor" | "preview" | null;

export class ScrollSync {
  private readonly editor: Editor;
  private readonly editorScrollEl: HTMLElement;
  private readonly previewScrollEl: HTMLElement;
  private readonly offRendered: () => void;
  private readonly offLayout: () => void;
  private layoutWatcher: PreviewLayoutWatcher | null = null;

  private scrollLock: ScrollLock = null;
  private suppress = 0;
  private enabled = true;
  private rafId = 0;
  private measuredAnchors: MeasuredAnchor[] = [];
  private useRatioFallback = true;

  constructor(
    editor: Editor,
    previewEl: HTMLElement,
    theme: Theme,
    layout: EditorLayoutMode = "split",
  ) {
    this.editor = editor;
    this.editorScrollEl = editor.getScrollDOM();
    this.previewScrollEl = previewEl;

    this.onEditorScroll = this.onEditorScroll.bind(this);
    this.onPreviewScroll = this.onPreviewScroll.bind(this);
    this.onPreviewRendered = this.onPreviewRendered.bind(this);
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.onTabsInteract = this.onTabsInteract.bind(this);

    this.editorScrollEl.addEventListener("scroll", this.onEditorScroll, { passive: true });
    this.previewScrollEl.addEventListener("scroll", this.onPreviewScroll, { passive: true });
    this.previewScrollEl.addEventListener("mousedown", this.onTabsInteract);

    this.offRendered = theme.on("preview:rendered", this.onPreviewRendered);
    this.offLayout = theme.on("editor:layout", this.onLayoutChange);

    this.enabled = layout === "split";
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.layoutWatcher?.disconnect();
    this.layoutWatcher = null;
    this.editorScrollEl.removeEventListener("scroll", this.onEditorScroll);
    this.previewScrollEl.removeEventListener("scroll", this.onPreviewScroll);
    this.previewScrollEl.removeEventListener("mousedown", this.onTabsInteract);
    this.offRendered();
    this.offLayout();
  }

  private onLayoutChange(payload: unknown): void {
    const mode = (payload as { mode?: string }).mode;
    this.enabled = mode === "split";
  }

  private onPreviewRendered(): void {
    this.layoutWatcher?.disconnect();
    this.layoutWatcher = watchPreviewLayout(this.previewScrollEl, () => this.remeasureAnchors());
    queueMicrotask(() => this.remeasureAnchors());
  }

  private remeasureAnchors(): void {
    this.measuredAnchors = measureSyncAnchors(this.previewScrollEl);
    this.useRatioFallback = this.measuredAnchors.length === 0;
  }

  private pause(): void {
    this.suppress += 1;
    window.setTimeout(() => {
      this.suppress -= 1;
    }, 100);
  }

  private onTabsInteract(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(".cherry-tabs")) return;
    if (!target.closest(".cherry-tabs__label")) return;
    this.pause();
  }

  private onEditorScroll(): void {
    if (!this.enabled || this.scrollLock === "preview" || this.suppress > 0) return;
    this.schedule(() => this.syncPreviewFromEditor());
  }

  private onPreviewScroll(): void {
    if (!this.enabled || this.scrollLock === "editor" || this.suppress > 0) return;
    this.schedule(() => this.syncEditorFromPreview());
  }

  private schedule(run: () => void): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(run);
  }

  private syncPreviewFromEditor(): void {
    this.scrollLock = "editor";
    if (this.useRatioFallback || this.measuredAnchors.length === 0) {
      applyScrollRatio(this.editorScrollEl, this.previewScrollEl);
    } else {
      const line = this.getEditorAnchorLine();
      this.previewScrollEl.scrollTop = previewScrollTopForSourceLine(
        line,
        this.measuredAnchors,
        this.previewScrollEl,
      );
    }
    this.scrollLock = null;
  }

  private syncEditorFromPreview(): void {
    this.scrollLock = "preview";
    if (this.useRatioFallback || this.measuredAnchors.length === 0) {
      applyScrollRatio(this.previewScrollEl, this.editorScrollEl);
    } else {
      const line = sourceLineForPreviewScroll(
        this.previewScrollEl.scrollTop,
        this.measuredAnchors,
        this.previewScrollEl,
      );
      this.editorScrollEl.scrollTop = this.editorScrollTopForLine(line);
    }
    this.scrollLock = null;
  }

  private getEditorAnchorLine(): number {
    const view = this.editor.getView();
    const anchorPixel =
      this.editorScrollEl.scrollTop + this.editorScrollEl.clientHeight * DEFAULT_SCROLL_ANCHOR_RATIO;
    const block = view.lineBlockAtHeight(anchorPixel);
    return view.state.doc.lineAt(block.from).number - 1;
  }

  private editorScrollTopForLine(line: number): number {
    const view = this.editor.getView();
    const doc = view.state.doc;
    const lineNumber = Math.min(Math.max(1, Math.floor(line) + 1), doc.lines);
    const block = view.lineBlockAt(doc.line(lineNumber).from);
    return Math.max(0, block.top - this.editorScrollEl.clientHeight * DEFAULT_SCROLL_ANCHOR_RATIO);
  }
}
