import { Divider } from "@/editor/divider/Divider";
import { Editor } from "@/editor/editor/Editor";
import { Preview } from "@/editor/preview/Preview";
import { SideBar } from "@/editor/sidebar/SideBar";
import { Toolbar } from "@/editor/toolbar/Toolbar";
import { StatusBar } from "@/editor/statusbar/StatusBar";
import type { CherryOptions, OnAiRequest } from "@/editor/CherryOptions";
import type { EditorLayoutMode } from "@/editor/Layout";
import { printCherryLogo } from "@/editor/Logo";
import { ScrollSync } from "@/editor/sync/ScrollSync";
import { CommandBridge } from "@/editor/CommandBridge.js";
import { DialogHost } from "@/editor/dialog/DialogHost.js";
import { runCommand as executeCommand } from "@/editor/commands/index.js";
import type { EditorCommand } from "@/editor/commands/index.js";
import type { EditorView } from "@codemirror/view";
import { Theme } from "@/theme/Theme";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { createDefaultStorage } from "@/core/StorageAPI";
import type { StorageAPI } from "@/core/StorageAPI";
import type {
  CherryLayoutPayload,
  CherrySidebarPayload,
  EditorChangePayload,
  EditorLifecyclePayload,
} from "@/editor/events";

/**
 * 创建带 class 的 DOM 元素
 *
 * @param tag 要创建的 HTML 标签名。
 * @param className 写入元素的 CSS 类名。
 * @param attrs 可选的属性键值对。
 * @returns 创建并初始化后的元素。
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  attrs?: Record<string, string>,
) {
  const node = document.createElement(tag);
  node.className = className;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  }
  return node;
}

/**
 * Cherry 主控：搭建 UI 骨架，子模块经 {@link EventBus} 事件总线通讯。
 *
 * ```
 * .cherry
 * ├── toolbar
 * ├── body → mask | sidebar | editor | divider | preview
 * ├── statusbar（可选）
 * └── dialog-host
 * ```
 */
export class Cherry {
  readonly theme: Theme;
  readonly eventBus: EventBus;
  readonly storage: StorageAPI;

  private readonly cherryEl: HTMLElement;
  private readonly toolbarEl: HTMLElement;
  private readonly bodyEl: HTMLElement;
  private readonly sidebarEl: HTMLElement;
  private readonly sidebarMaskEl: HTMLElement;
  private readonly editorEl: HTMLElement;
  private readonly dividerEl: HTMLElement;
  private readonly previewEl: HTMLElement;
  private readonly statusbarEl: HTMLElement | null = null;

  private readonly preview: Preview;
  private readonly editor: Editor;
  private readonly toolbar: Toolbar | null;
  private readonly sidebar: SideBar | null;
  private readonly divider: Divider;
  private readonly statusbar: StatusBar | null = null;
  private readonly commandBridge: CommandBridge;
  private readonly dialogHost: DialogHost;
  private readonly scrollSync: ScrollSync;

  private readonly log: Log;
  private readonly onAiRequest?: OnAiRequest;

  private destroyed = false;

  /**
   * 创建 Cherry 编辑器实例并组装各个 UI 子模块。
   *
   * @param rootEl 承载编辑器 DOM 树的根元素。
   * @param options 编辑器、主题及各子模块的初始化选项。
   */
  constructor(
    private readonly rootEl: HTMLElement,
    options: CherryOptions = {},
  ) {
    printCherryLogo();
    this.log = new Log(options.debug);
    this.eventBus = new EventBus(options.debug, "[cherry]", this.log);
    this.storage = options.storage ?? createDefaultStorage();

    const {
      themeId = "default",
      appearance = "light",
      preview: previewOptions = {},
      statusbar = true,
    } = options;

    const editorOptions = {
      ...(options.editor ?? {}),
      onAiRequest: options.editor?.onAiRequest ?? options.onAiRequest,
      onParseFile: options.editor?.onParseFile ?? options.onParseFile,
    };

    const initialLayout = options.layout ?? "split";
    this.onAiRequest = editorOptions.onAiRequest;

    this.cherryEl = el("div", "cherry");
    this.toolbarEl = el("div", "cherry-toolbar");
    this.bodyEl = el("div", "cherry-body");
    this.sidebarMaskEl = el("div", "cherry-sidebar-mask");
    this.sidebarEl = el("div", "cherry-sidebar");
    this.editorEl = el("div", "cherry-editor");
    this.dividerEl = el("div", "cherry-divider");
    this.previewEl = el("div", "cherry-preview cherry-render");

    this.theme = new Theme(this.eventBus, this.log, rootEl, options.themes);

    this.cherryEl.appendChild(this.toolbarEl);
    this.bodyEl.appendChild(this.sidebarMaskEl);
    this.bodyEl.appendChild(this.sidebarEl);
    this.bodyEl.appendChild(this.editorEl);
    this.bodyEl.appendChild(this.dividerEl);
    this.bodyEl.appendChild(this.previewEl);
    this.cherryEl.appendChild(this.bodyEl);

    // 遮罩点击关闭侧边栏
    this.sidebarMaskEl.addEventListener("click", () => {
      this.eventBus.emit("cherry:sidebar", { show: false });
    });

    if (statusbar) {
      this.statusbarEl = el("div", "cherry-statusbar-wrap");
      this.cherryEl.appendChild(this.statusbarEl);
    }

    this.rootEl.appendChild(this.cherryEl);

    this.theme.setTheme(themeId);
    this.theme.setLightDark(appearance);

    this.preview = new Preview(
      this.previewEl,
      this.theme,
      this.eventBus,
      this.log,
      { ...previewOptions },
    );

    this.editor = new Editor(this.editorEl, this.eventBus, editorOptions);

    if (statusbar && this.statusbarEl) {
      this.statusbar = new StatusBar(
        this.statusbarEl,
        this.eventBus,
        options.debug === true,
      );
    }

    this.divider = new Divider(this.dividerEl, this.eventBus, this.storage);
    this.divider.setLayout(initialLayout);

    this.toolbar =
      options.toolbar === false
        ? null
        : new Toolbar(
            this.toolbarEl,
            this.eventBus,
            options.toolbar!!,
            options.themes,
            () => this.editor.focus(),
          );

    this.sidebar = new SideBar(
      this.sidebarEl,
      this.eventBus,
      typeof options.sidebar === "object" ? options.sidebar : {},
    );

    this.scrollSync = new ScrollSync(
      this.editor,
      this.previewEl,
      this.eventBus,
    );

    this.dialogHost = new DialogHost(this.cherryEl, this.eventBus);
    this.commandBridge = new CommandBridge(
      this.eventBus,
      this.theme,
      () => this.editor.getView(),
      () => this.preview.getStore(),
      this.onAiRequest,
    );

    this.eventBus.on<CherryLayoutPayload>("cherry:layout", (payload) => {
      this.setLayout(payload.mode);
    });

    this.eventBus.on<CherrySidebarPayload>("cherry:sidebar", (payload) => {
      this.setSidebarVisible(payload.show);
    });

    queueMicrotask(() => {
      if (this.destroyed) return;
      this.eventBus.emit("cherry:layout", {
        mode: initialLayout,
      } satisfies CherryLayoutPayload);
      this.eventBus.emit("cherry:sidebar", {
        show: options.sidebar !== false,
      } satisfies CherrySidebarPayload);
      this.eventBus.emit("editor:ready", {
        el: this.cherryEl,
      } satisfies EditorLifecyclePayload);
    });
  }

  /** 获取当前 CodeMirror 中保存的 Markdown 文本。 */
  getMarkdown(): string {
    return this.editor.getMarkdown();
  }

  /**
   * 替换编辑器中的完整 Markdown 文本。
   *
   * @param markdown 要写入编辑器的新 Markdown 内容。
   */
  setMarkdown(markdown: string): void {
    this.editor.setMarkdown(markdown);
  }

  /** 获取当前编辑器布局模式。 */
  getLayout(): EditorLayoutMode {
    return this.divider.getLayout();
  }

  /**
   * 切换编辑器布局，并由 Divider 更新相应 DOM 状态。
   *
   * @param mode 要应用的编辑器布局模式。
   */
  setLayout(mode: EditorLayoutMode): void {
    this.divider.setLayout(mode);
  }

  /** 判断侧边栏当前是否处于可见状态。 */
  isSidebarVisible(): boolean {
    return this.sidebarEl.style.display !== "none";
  }

  /**
   * split 布局下显隐后会重算分栏比例
   *
   * @param show 为 `true` 时显示侧边栏，为 `false` 时隐藏。
   */
  setSidebarVisible(show: boolean): void {
    this.sidebarEl.style.display = show ? "" : "none";
    this.sidebarMaskEl.classList.toggle("is-active", show);
    if (this.getLayout() === "split") {
      this.divider.setSplit(this.divider.getSplit());
    }
  }

  /** 切换侧边栏的显示与隐藏状态。 */
  toggleSidebar(): void {
    this.setSidebarVisible(!this.isSidebarVisible());
  }

  /**
   * 标记侧边栏中指定文件为当前活动文件。
   *
   * @param fileId 要激活的文件标识。
   */
  setSidebarActiveFile(fileId: string): void {
    this.sidebar?.setActiveFile(fileId);
  }

  /**
   * 工具栏 / API 共用的命令上下文，保证 getStore 语义一致。
   * 包含事件总线、主题及预览解析存储访问器的命令上下文。
   * @returns
   */
  private commandCtx() {
    return {
      eventBus: this.eventBus,
      theme: this.theme,
      getStore: () => this.preview.getStore(),
      onAiRequest: this.onAiRequest,
    };
  }

  /**
   * 执行已注册的编辑器命令。
   *
   * @param command 要执行的命令标识。
   * @param payload 传递给命令的可选参数。
   * @returns 命令是否执行成功；异步命令返回对应的 Promise。
   */
  runCommand(
    command: EditorCommand | string,
    payload?: unknown,
  ): boolean | Promise<boolean> {
    return executeCommand(
      this.editor.getView(),
      command,
      payload,
      this.commandCtx(),
    );
  }

  /**
   * 销毁编辑器及其全部子模块，并从挂载点移除 DOM。
   *
   * 重复调用不会产生额外副作用。
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.eventBus.emit("editor:destroy", {
      el: this.cherryEl,
    } satisfies EditorLifecyclePayload);
    this.commandBridge.destroy();
    this.dialogHost.destroy();
    this.toolbar?.destroy();
    this.sidebar?.destroy();
    this.divider.destroy();
    this.scrollSync.destroy();
    this.editor.destroy();
    this.preview.destroy();
    this.statusbar?.destroy();
    this.cherryEl.remove();
  }
}
