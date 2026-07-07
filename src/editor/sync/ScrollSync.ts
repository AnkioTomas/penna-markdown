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

    this.initListeners();
  }

  private getPreviewScrollTopForLine(targetLine: number): number {
    const blocks = this.currentBlocks;
    if (!blocks || blocks.length === 0) return 0;
    
    let bestIndex = 0;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].startLine <= targetLine) {
        bestIndex = i;
      } else {
        break;
      }
    }
    const el = this.previewScroll.children[bestIndex] as HTMLElement;
    return el ? el.offsetTop : 0;
  }

  private getLineForPreviewScroll(): number {
    const blocks = this.currentBlocks;
    if (!blocks || blocks.length === 0) return 1;
    
    const scrollTop = this.previewScroll.scrollTop;
    let bestLine = 1;
    for (let i = 0; i < this.previewScroll.children.length; i++) {
      const el = this.previewScroll.children[i] as HTMLElement;
      if (el && el.offsetTop <= scrollTop + 10) {
        bestLine = blocks[i]?.startLine ?? bestLine;
      } else {
        break;
      }
    }
    return bestLine;
  }

  private initListeners(): void {
    const editorView = this.editor.getView();

    this.editorScroll.addEventListener("scroll", () => {
      if (!this.isSyncingLeft) {
        this.isSyncingRight = true;
        
        if (this.editorScroll.scrollTop >= this.editorScroll.scrollHeight - this.editorScroll.clientHeight - 5) {
          this.previewScroll.scrollTop = this.previewScroll.scrollHeight;
        } else if (this.editorScroll.scrollTop <= 5) {
          this.previewScroll.scrollTop = 0;
        } else {
          const topBlock = editorView.lineBlockAtHeight(this.editorScroll.scrollTop);
          const line = editorView.state.doc.lineAt(topBlock.from).number - 1; 
          this.previewScroll.scrollTop = this.getPreviewScrollTopForLine(line);
        }
      }
      this.isSyncingLeft = false;
    }, { passive: true });

    this.previewScroll.addEventListener("scroll", () => {
      if (!this.isSyncingRight) {
        this.isSyncingLeft = true;
        
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
      }
      this.isSyncingRight = false;
    }, { passive: true });
  }
}
