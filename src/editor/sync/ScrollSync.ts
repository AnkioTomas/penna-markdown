import type { Editor } from "@/editor/editor/Editor";
import type { EventBus } from "@/core/event/EventBus";

export class ScrollSync {
  private currentBlocks: any[] = [];
  private isSyncingLeft = false;
  private isSyncingRight = false;
  private readonly editorScroll: HTMLElement;
  private readonly previewScroll: HTMLElement;
  private readonly offs: (() => void)[] = [];
  private destroyed = false;

  private leftRaf: number | null = null;
  private rightRaf: number | null = null;
  private leftTimer: ReturnType<typeof setTimeout> | null = null;
  private rightTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly onEditorScroll = () => {
    if (this.isSyncingLeft) return;

    this.isSyncingRight = true;
    if (this.rightTimer != null) clearTimeout(this.rightTimer);
    this.rightTimer = setTimeout(() => {
      this.isSyncingRight = false;
    }, 50);

    if (this.leftRaf !== null) cancelAnimationFrame(this.leftRaf);
    this.leftRaf = requestAnimationFrame(() => {
      const editorView = this.editor.getView();
      if (
        this.editorScroll.scrollTop >=
        this.editorScroll.scrollHeight - this.editorScroll.clientHeight - 5
      ) {
        this.previewScroll.scrollTop = this.previewScroll.scrollHeight;
      } else if (this.editorScroll.scrollTop <= 5) {
        this.previewScroll.scrollTop = 0;
      } else {
        const topBlock = editorView.lineBlockAtHeight(
          this.editorScroll.scrollTop,
        );
        const line = editorView.state.doc.lineAt(topBlock.from).number - 1;
        this.previewScroll.scrollTop = this.getPreviewScrollTopForLine(line);
      }
    });
  };

  private readonly onPreviewScroll = () => {
    if (this.isSyncingRight) return;

    this.isSyncingLeft = true;
    if (this.leftTimer != null) clearTimeout(this.leftTimer);
    this.leftTimer = setTimeout(() => {
      this.isSyncingLeft = false;
    }, 50);

    if (this.rightRaf !== null) cancelAnimationFrame(this.rightRaf);
    this.rightRaf = requestAnimationFrame(() => {
      const editorView = this.editor.getView();
      if (
        this.previewScroll.scrollTop >=
        this.previewScroll.scrollHeight - this.previewScroll.clientHeight - 5
      ) {
        this.editorScroll.scrollTop = this.editorScroll.scrollHeight;
      } else if (this.previewScroll.scrollTop <= 5) {
        this.editorScroll.scrollTop = 0;
      } else {
        const targetLine = this.getLineForPreviewScroll();
        const maxLine = editorView.state.doc.lines;
        const lineInfo = editorView.state.doc.line(
          Math.min(targetLine + 1, maxLine),
        );
        const block = editorView.lineBlockAt(lineInfo.from);
        this.editorScroll.scrollTop = block.top;
      }
    });
  };

  constructor(
    private readonly editor: Editor,
    previewEl: HTMLElement,
    private readonly eventBus: EventBus,
  ) {
    this.editorScroll = editor.getView().scrollDOM;
    this.previewScroll = previewEl;

    if (!this.editorScroll || !this.previewScroll) return;

    this.previewScroll.style.position = "relative";

    this.offs.push(
      this.eventBus.on("preview:rendered", (payload: any) => {
        this.currentBlocks = payload.blocks || [];
      }),
      this.eventBus.on("sidebar:toc-click", (payload: any) => {
        const target =
          document.getElementById(payload.id) ||
          this.previewScroll.querySelector(`[data-hash="${payload.id}"]`);
        if (target) {
          this.previewScroll.scrollTo({
            top: (target as HTMLElement).offsetTop,
            behavior: "smooth",
          });
        }
      }),
    );

    this.editorScroll.addEventListener("scroll", this.onEditorScroll, {
      passive: true,
    });
    this.previewScroll.addEventListener("scroll", this.onPreviewScroll, {
      passive: true,
    });
    this.offs.push(
      () =>
        this.editorScroll.removeEventListener("scroll", this.onEditorScroll),
      () =>
        this.previewScroll.removeEventListener("scroll", this.onPreviewScroll),
    );
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.leftTimer != null) clearTimeout(this.leftTimer);
    if (this.rightTimer != null) clearTimeout(this.rightTimer);
    this.leftTimer = null;
    this.rightTimer = null;

    if (this.leftRaf !== null) cancelAnimationFrame(this.leftRaf);
    if (this.rightRaf !== null) cancelAnimationFrame(this.rightRaf);
    this.leftRaf = null;
    this.rightRaf = null;

    for (const off of this.offs) off();
    this.offs.length = 0;
  }

  private getPreviewScrollTopForLine(targetLine: number): number {
    const blocks = this.currentBlocks;
    if (!blocks || blocks.length === 0) return 0;

    let low = 0;
    let high = blocks.length - 1;
    let bestIndex = 0;

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (blocks[mid].startLine <= targetLine) {
        bestIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const el = this.previewScroll.children[bestIndex] as HTMLElement;
    return el ? el.offsetTop : 0;
  }

  private getLineForPreviewScroll(): number {
    const blocks = this.currentBlocks;
    if (!blocks || blocks.length === 0) return 1;

    const scrollTop = this.previewScroll.scrollTop;
    let low = 0;
    let high = this.previewScroll.children.length - 1;
    let bestIndex = 0;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const el = this.previewScroll.children[mid] as HTMLElement;
      if (!el) break;

      if (el.offsetTop <= scrollTop + 10) {
        bestIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return blocks[bestIndex]?.startLine ?? 1;
  }
}
