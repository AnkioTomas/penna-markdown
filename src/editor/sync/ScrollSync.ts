import type { Editor } from "@/editor/editor/Editor";
import type { Theme } from "@/theme/Theme";

export class ScrollSync {
  private currentBlocks: any[] = [];
  private isSyncingLeft = false;
  private isSyncingRight = false;
  private readonly editorScroll: HTMLElement;
  private readonly previewScroll: HTMLElement;

  constructor(
    private readonly editor: Editor,
    previewEl: HTMLElement,
    private readonly theme: Theme
  ) {
    this.editorScroll = editor.getView().scrollDOM;
    this.previewScroll = previewEl;
    
    if (!this.editorScroll || !this.previewScroll) return;

    this.previewScroll.style.position = "relative";

    this.theme.on("preview:rendered", (payload: any) => {
      this.currentBlocks = payload.blocks || [];
    });

    this.theme.on("sidebar:toc-click", (payload: any) => {
      const target = document.getElementById(payload.id) || this.previewScroll.querySelector(`[data-hash="${payload.id}"]`);
      if (target) {
        this.previewScroll.scrollTo({ top: (target as HTMLElement).offsetTop, behavior: "smooth" });
      }
    });

    this.initListeners();
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

  private leftRaf: number | null = null;
  private rightRaf: number | null = null;
  private leftTimer: any = null;
  private rightTimer: any = null;

  private initListeners(): void {
    const editorView = this.editor.getView();

    this.editorScroll.addEventListener("scroll", () => {
      if (this.isSyncingLeft) return;
      
      this.isSyncingRight = true;
      clearTimeout(this.rightTimer);
      this.rightTimer = setTimeout(() => { this.isSyncingRight = false; }, 50);

      if (this.leftRaf !== null) cancelAnimationFrame(this.leftRaf);
      this.leftRaf = requestAnimationFrame(() => {
        if (this.editorScroll.scrollTop >= this.editorScroll.scrollHeight - this.editorScroll.clientHeight - 5) {
          this.previewScroll.scrollTop = this.previewScroll.scrollHeight;
        } else if (this.editorScroll.scrollTop <= 5) {
          this.previewScroll.scrollTop = 0;
        } else {
          const topBlock = editorView.lineBlockAtHeight(this.editorScroll.scrollTop);
          const line = editorView.state.doc.lineAt(topBlock.from).number - 1; 
          this.previewScroll.scrollTop = this.getPreviewScrollTopForLine(line);
        }
      });
    }, { passive: true });

    this.previewScroll.addEventListener("scroll", () => {
      if (this.isSyncingRight) return;

      this.isSyncingLeft = true;
      clearTimeout(this.leftTimer);
      this.leftTimer = setTimeout(() => { this.isSyncingLeft = false; }, 50);

      if (this.rightRaf !== null) cancelAnimationFrame(this.rightRaf);
      this.rightRaf = requestAnimationFrame(() => {
        if (this.previewScroll.scrollTop >= this.previewScroll.scrollHeight - this.previewScroll.clientHeight - 5) {
          this.editorScroll.scrollTop = this.editorScroll.scrollHeight;
        } else if (this.previewScroll.scrollTop <= 5) {
          this.editorScroll.scrollTop = 0;
        } else {
          const targetLine = this.getLineForPreviewScroll();
          const maxLine = editorView.state.doc.lines;
          const lineInfo = editorView.state.doc.line(Math.min(targetLine + 1, maxLine));
          const block = editorView.lineBlockAt(lineInfo.from);
          this.editorScroll.scrollTop = block.top;
        }
      });
    }, { passive: true });
  }
}
