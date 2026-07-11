import type { EventBus } from "@/core/event/EventBus";
import { debounce } from "@/core/debounce";
import type {
  CherryLayoutPayload,
  CherrySidebarPayload,
  EditorChangePayload,
  PreviewRenderedPayload,
} from "@/editor/events";
import type { EditorLayoutMode } from "@/editor/Layout";

const ICON_SIDEBAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>`;
const ICON_EDIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const ICON_PREVIEW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const ICON_SPLIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path></svg>`;
const ICON_REFRESH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`;

const STATS_DEBOUNCE_MS = 200;

/** 提供侧边栏、布局、刷新和文档统计控制的底部状态栏。 */
export class StatusBar {
  private readonly leftEl: HTMLElement;
  private readonly rightEl: HTMLElement;
  private readonly countEl: HTMLElement;
  private readonly perfEl: HTMLElement | null;
  private readonly offs: Set<() => void> = new Set();

  private sidebarVisible = true;
  private layoutMode: EditorLayoutMode = "split";
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debouncedUpdateStats = debounce((markdown: string) => {
    this.updateStats(markdown);
  }, STATS_DEBOUNCE_MS);

  /**
   * 创建状态栏 DOM 并订阅编辑内容变化。
   *
   * @param mount 承载状态栏的 DOM 元素。
   * @param eventBus 用于发布控制事件和接收状态变化的事件总线。
   * @param debug 为 `true` 时显示预览渲染耗时（监听 `preview:rendered`）。
   */
  constructor(
    private readonly mount: HTMLElement,
    private readonly eventBus: EventBus,
    private readonly debug = false,
  ) {
    this.mount.classList.add("cherry-statusbar");

    if (this.debug) {
      const perf = document.createElement("div");
      perf.className = "cherry-statusbar-perf";
      perf.textContent = "无";
      this.perfEl = perf;
    } else {
      this.perfEl = null;
    }

    this.leftEl = document.createElement("div");
    this.leftEl.className = "cherry-statusbar-left";
    this.mount.appendChild(this.leftEl);

    this.rightEl = document.createElement("div");
    this.rightEl.className = "cherry-statusbar-right";
    this.mount.appendChild(this.rightEl);

    this.countEl = document.createElement("div");
    this.countEl.className = "cherry-statusbar-count";
    this.rightEl.appendChild(this.countEl);

    this.initButtons();
    this.initRightButtons();

    this.offs.add(
      this.eventBus.on<EditorChangePayload>("editor:change", (payload) => {
        this.debouncedUpdateStats(payload.markdown);
      }),
    );

    if (this.debug) {
      this.offs.add(
        this.eventBus.on<PreviewRenderedPayload>(
          "preview:rendered",
          (payload) => {
            this.updatePerfDisplay(payload);
          },
        ),
      );
    }
  }

  /** 初始化左侧的侧边栏及布局切换按钮，并绑定状态同步事件。 */
  private initButtons() {
    const btnSidebar = document.createElement("button");
    btnSidebar.className = "cherry-statusbar-btn";
    btnSidebar.innerHTML = ICON_SIDEBAR;
    btnSidebar.title = "切换侧边栏";
    btnSidebar.onclick = () => {
      this.sidebarVisible = !this.sidebarVisible;
      this.eventBus.emit("cherry:sidebar", {
        show: this.sidebarVisible,
      } satisfies CherrySidebarPayload);
      btnSidebar.classList.toggle("is-active", this.sidebarVisible);
    };
    btnSidebar.classList.toggle("is-active", this.sidebarVisible);
    this.leftEl.appendChild(btnSidebar);

    const btnEdit = document.createElement("button");
    btnEdit.className = "cherry-statusbar-btn";
    btnEdit.innerHTML = ICON_EDIT;
    btnEdit.title = "纯编辑模式";
    btnEdit.onclick = () => this.switchLayout("edit", btnEdit);
    this.leftEl.appendChild(btnEdit);

    const btnPreview = document.createElement("button");
    btnPreview.className = "cherry-statusbar-btn";
    btnPreview.innerHTML = ICON_PREVIEW;
    btnPreview.title = "纯预览模式";
    btnPreview.onclick = () => this.switchLayout("preview", btnPreview);
    this.leftEl.appendChild(btnPreview);

    const btnSplit = document.createElement("button");
    btnSplit.className = "cherry-statusbar-btn";
    btnSplit.innerHTML = ICON_SPLIT;
    btnSplit.title = "双栏模式";
    btnSplit.onclick = () => this.switchLayout("split", btnSplit);
    this.leftEl.appendChild(btnSplit);

    // Default layout
    btnSplit.classList.add("is-active");

    this.offs.add(
      this.eventBus.on<CherryLayoutPayload>("cherry:layout", (payload) => {
        const mode = payload.mode;
        this.layoutMode = mode;
        const btns = this.leftEl.querySelectorAll(
          ".cherry-statusbar-btn:not(:first-child)",
        );
        btns.forEach((b) => b.classList.remove("is-active"));
        if (mode === "edit") btnEdit.classList.add("is-active");
        else if (mode === "preview") btnPreview.classList.add("is-active");
        else btnSplit.classList.add("is-active");
      }),
    );

    this.offs.add(
      this.eventBus.on<CherrySidebarPayload>("cherry:sidebar", (payload) => {
        this.sidebarVisible = payload.show;
        btnSidebar.classList.toggle("is-active", payload.show);
      }),
    );
  }

  /** 初始化右侧的强制预览刷新按钮。 */
  private initRightButtons() {
    const btnRefresh = document.createElement("button");
    btnRefresh.className = "cherry-statusbar-btn";
    btnRefresh.innerHTML = ICON_REFRESH;
    btnRefresh.title = "强制全量刷新渲染";
    btnRefresh.onclick = () => {
      this.eventBus.emit("preview:force-refresh", {});

      const svg = btnRefresh.querySelector("svg");
      if (svg) {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        svg.style.transition = "transform 0.5s ease";
        svg.style.transform = `rotate(360deg)`;
        this.refreshTimer = setTimeout(() => {
          this.refreshTimer = null;
          svg.style.transition = "none";
          svg.style.transform = `rotate(0deg)`;
        }, 500);
      }
    };

    this.rightEl.appendChild(btnRefresh);

    if (this.debug && this.perfEl) {
      this.rightEl.appendChild(this.perfEl);
    }
  }

  /** 更新 debug 模式下最近一次渲染类型与耗时。 */
  private updatePerfDisplay(payload: PreviewRenderedPayload): void {
    if (!this.perfEl) return;

    const ms = payload.partial
      ? payload.incrementalRenderMs
      : payload.fullRenderMs;
    if (ms == null) {
      this.perfEl.textContent = "无";
      return;
    }

    const label = payload.partial ? "增量" : "全量";
    this.perfEl.textContent = `${label} ${ms.toFixed(1)}ms`;
  }

  /**
   * 请求切换编辑器布局。
   *
   * @param mode 要切换到的布局模式。
   * @param _activeBtn 触发请求的按钮，保留以维持按钮回调接口。
   */
  private switchLayout(mode: EditorLayoutMode, _activeBtn: HTMLElement) {
    if (this.layoutMode === mode) return;
    this.eventBus.emit("cherry:layout", { mode } satisfies CherryLayoutPayload);
  }

  /**
   * 统计 Markdown 文本的词数和字符数，并更新显示。
   *
   * @param text 要统计的 Markdown 文本。
   */
  private updateStats(text: string): void {
    const charCount = text.length;
    // 简单的字数统计（英文按空格分词，中文粗略按字算）
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    let wordCount = 0;

    for (const w of words) {
      // 如果包含中文字符，则中文字符每个算一个字，非中文部分算一个词
      const cnMatches = w.match(/[\u4e00-\u9fa5]/g);
      const cnCount = cnMatches ? cnMatches.length : 0;
      const nonCnPart = w.replace(/[\u4e00-\u9fa5]/g, "").trim();
      wordCount += cnCount + (nonCnPart.length > 0 ? 1 : 0);
    }

    this.countEl.textContent = `${wordCount} 词 · ${charCount} 字符`;
  }

  /** 清除刷新动画计时器并注销全部事件订阅。 */
  destroy(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.debouncedUpdateStats.cancel();
    this.refreshTimer = null;
    for (const off of this.offs) off();
    this.offs.clear();
  }
}
