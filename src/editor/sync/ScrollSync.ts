import type { Editor } from "@/editor/editor/Editor";
import type { EventBus } from "@/core/event/EventBus";
import { debounce } from "@/core/debounce";
import type { BlockIndex } from "@/renderer/incremental/BlockIndex";
import type {
  PreviewRenderedPayload,
  SidebarTocClickPayload,
} from "@/editor/events";

/** 顶/底吸附像素容差 */
const SCROLL_EDGE_PX = 5;
/** 预览二分查找时的顶部偏移容差 */
const PREVIEW_HIT_SLACK_PX = 10;
/** 单向同步结束后释放锁的延迟 */
const SYNC_UNLOCK_MS = 50;

/** 在编辑器和预览面板之间按源行位置同步滚动。 */
export class ScrollSync {
  private currentBlocks: BlockIndex[] = [];
  private isSyncingLeft = false;
  private isSyncingRight = false;
  private readonly editorScroll: HTMLElement;
  private readonly previewScroll: HTMLElement;
  /** 块 DOM 挂载点（`.cherry-render`）；无内层时等于 `previewScroll` */
  private readonly previewContent: HTMLElement;
  private readonly offs: (() => void)[] = [];
  private destroyed = false;

  private leftRaf: number | null = null;
  private rightRaf: number | null = null;
  private readonly releaseRightSync = debounce(() => {
    this.isSyncingRight = false;
  }, SYNC_UNLOCK_MS);
  private readonly releaseLeftSync = debounce(() => {
    this.isSyncingLeft = false;
  }, SYNC_UNLOCK_MS);

  private readonly onEditorScroll = () => {
    if (this.isSyncingLeft) return;

    this.isSyncingRight = true;
    this.releaseRightSync();

    if (this.leftRaf !== null) cancelAnimationFrame(this.leftRaf);
    this.leftRaf = requestAnimationFrame(() => {
      const editorView = this.editor.getView();
      if (
        this.editorScroll.scrollTop >=
        this.editorScroll.scrollHeight -
          this.editorScroll.clientHeight -
          SCROLL_EDGE_PX
      ) {
        this.previewScroll.scrollTop = this.previewScroll.scrollHeight;
      } else if (this.editorScroll.scrollTop <= SCROLL_EDGE_PX) {
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
    this.releaseLeftSync();

    if (this.rightRaf !== null) cancelAnimationFrame(this.rightRaf);
    this.rightRaf = requestAnimationFrame(() => {
      const editorView = this.editor.getView();
      if (
        this.previewScroll.scrollTop >=
        this.previewScroll.scrollHeight -
          this.previewScroll.clientHeight -
          SCROLL_EDGE_PX
      ) {
        this.editorScroll.scrollTop = this.editorScroll.scrollHeight;
      } else if (this.previewScroll.scrollTop <= SCROLL_EDGE_PX) {
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

  /**
   * 创建双向滚动同步，并监听预览块索引和目录跳转事件。
   *
   * @param editor 提供 CodeMirror 滚动容器和文档行信息的编辑器实例。
   * @param previewEl 可滚动的预览容器。
   * @param eventBus 用于接收预览渲染和目录点击事件的事件总线。
   */
  constructor(
    private readonly editor: Editor,
    previewEl: HTMLElement,
    private readonly eventBus: EventBus,
  ) {
    this.editorScroll = editor.getView().scrollDOM;
    this.previewScroll = previewEl;
    this.previewContent =
      (previewEl.querySelector(":scope > .cherry-render") as HTMLElement) ??
      previewEl;

    if (!this.editorScroll || !this.previewScroll) return;

    this.previewScroll.style.position = "relative";

    this.offs.push(
      this.eventBus.on<PreviewRenderedPayload>(
        "preview:rendered",
        (payload) => {
          this.currentBlocks = payload.blocks ?? [];
        },
      ),
      this.eventBus.on<SidebarTocClickPayload>(
        "sidebar:toc-click",
        (payload) => {
          const target =
            document.getElementById(payload.id) ||
            this.previewContent.querySelector(`[data-hash="${payload.id}"]`);
          if (target) {
            this.previewScroll.scrollTo({
              top: (target as HTMLElement).offsetTop,
              behavior: "smooth",
            });
          }
        },
      ),
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

  /** 取消未执行的滚动任务并注销所有事件监听。 */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.releaseLeftSync.cancel();
    this.releaseRightSync.cancel();

    if (this.leftRaf !== null) cancelAnimationFrame(this.leftRaf);
    if (this.rightRaf !== null) cancelAnimationFrame(this.rightRaf);
    this.leftRaf = null;
    this.rightRaf = null;

    for (const off of this.offs) off();
    this.offs.length = 0;
  }

  /**
   * 查找与编辑器源行对应的预览块顶部位置。
   *
   * @param targetLine 编辑器中从零开始计数的目标源行。
   * @returns 预览容器应滚动到的垂直偏移量。
   */
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
    const el = this.previewContent.children[bestIndex] as HTMLElement;
    return el ? el.offsetTop : 0;
  }

  /**
   * 查找当前预览滚动位置对应的源行。
   *
   * @returns 对应块的源行号；没有块时返回首行。
   */
  private getLineForPreviewScroll(): number {
    const blocks = this.currentBlocks;
    if (!blocks || blocks.length === 0) return 1;

    const scrollTop = this.previewScroll.scrollTop;
    let low = 0;
    let high = this.previewContent.children.length - 1;
    let bestIndex = 0;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const el = this.previewContent.children[mid] as HTMLElement;
      if (!el) break;

      if (el.offsetTop <= scrollTop + PREVIEW_HIT_SLACK_PX) {
        bestIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return blocks[bestIndex]?.startLine ?? 1;
  }
}
