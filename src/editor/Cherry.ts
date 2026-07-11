import { Divider } from "@/editor/divider/Divider";
import { Editor } from "@/editor/editor/Editor";
import { Preview } from "@/editor/preview/Preview";
import { SideBar } from "@/editor/sidebar/SideBar";
import { Toolbar } from "@/editor/toolbar/Toolbar";
import { StatusBar } from "@/editor/statusbar/StatusBar";
import type { CherryOptions } from "@/editor/CherryOptions";
import type { EditorLayoutMode } from "@/editor/Layout";
import { printCherryLogo } from "@/editor/printLogo";
import { ScrollSync } from "@/editor/sync/ScrollSync";
import { CommandBridge } from "@/editor/CommandBridge.js";
import { DialogHost } from "@/editor/dialog/DialogHost.js";
import { runCommand as executeCommand } from "@/editor/commands/index.js";
import type { EditorCommand } from "@/editor/commands/index.js";
import type { EditorView } from "@codemirror/view";
import { Theme } from "@/theme/Theme";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";

/** 创建带 class 的 DOM 元素 */
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

  private destroyed = false;

  constructor(
    private readonly rootEl: HTMLElement,
    options: CherryOptions = {},
  ) {
    printCherryLogo();
    this.log = new Log(options.debug);
    this.eventBus = new EventBus(options.debug, "[cherry]", this.log);

    const {
      themeId = "default",
      appearance = "light",
      editor: editorOptions = {},
      preview: previewOptions = {},
      transformer = {},
      statusbar = true,
    } = options;

    const initialLayout = options.layout ?? "split";

    this.cherryEl = el("div", "cherry");
    this.toolbarEl = el("div", "cherry-toolbar");
    this.bodyEl = el("div", "cherry-body");
    this.sidebarMaskEl = el("div", "cherry-sidebar-mask");
    this.sidebarEl = el("div", "cherry-sidebar");
    this.editorEl = el("div", "cherry-editor");
    this.dividerEl = el("div", "cherry-divider");
    this.previewEl = el("div", "cherry-preview cherry-render");

    this.theme = new Theme(
      this.eventBus,
      this.log,
      rootEl,
      options.themes ?? [],
    );

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
      {
        inlineParsers:
          previewOptions.inlineParsers ?? transformer.inlineParsers,
        blockParsers: previewOptions.blockParsers ?? transformer.blockParsers,
      },
    );

    this.editor = new Editor(this.editorEl, this.eventBus, {
      ...editorOptions,
      ai: options.ai,
      storage: options.storage ?? editorOptions.storage,
      transformerEngineOptions:
        editorOptions.transformerEngineOptions ?? transformer,
    });

    if (statusbar && this.statusbarEl) {
      this.statusbar = new StatusBar(this.statusbarEl, this.eventBus);
    }

    this.divider = new Divider(this.dividerEl, this.eventBus);
    this.divider.setLayout(initialLayout);

    this.toolbar =
      options.toolbar === false
        ? null
        : new Toolbar(
            this.toolbarEl,
            this.eventBus,
            { ...options.toolbar, ai: options.ai },
            () => this.editor.focus(),
          );

    this.sidebar = new SideBar(
      this.sidebarEl,
      this.eventBus,
      typeof options.sidebar === "object" ? options.sidebar : {},
    );

    if (options.sidebar === false) {
      this.sidebarEl.style.display = "none";
    }

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
    );

    const initialMarkdown = editorOptions.value ?? "";
    if (initialMarkdown) {
      this.eventBus.emit("editor:change", { markdown: initialMarkdown });
    }
    this.eventBus.on("cherry:layout", (payload: any) => {
      this.setLayout(payload.mode);
    });

    this.eventBus.on("cherry:sidebar", (payload: any) => {
      this.setSidebarVisible(payload.show);
    });

    queueMicrotask(() => {
      if (this.destroyed) return;
      this.eventBus.emit("cherry:layout", { mode: initialLayout });
      this.eventBus.emit("cherry:sidebar", { show: options.sidebar !== false });
      this.eventBus.emit("editor:ready", { el: this.cherryEl });
    });

    printCherryLogo();
  }

  getMarkdown(): string {
    return this.editor.getMarkdown();
  }

  setMarkdown(markdown: string): void {
    this.editor.setMarkdown(markdown);
  }

  getLayout(): EditorLayoutMode {
    return this.divider.getLayout();
  }

  setLayout(mode: EditorLayoutMode): void {
    this.divider.setLayout(mode);
  }

  isSidebarVisible(): boolean {
    return this.sidebarEl.style.display !== "none";
  }

  /** split 布局下显隐后会重算分栏比例 */
  setSidebarVisible(show: boolean): void {
    this.sidebarEl.style.display = show ? "" : "none";
    this.sidebarMaskEl.classList.toggle("is-active", show);
    if (this.getLayout() === "split") {
      this.divider.setSplit(this.divider.getSplit());
    }
  }

  toggleSidebar(): void {
    this.setSidebarVisible(!this.isSidebarVisible());
  }

  setSidebarActiveFile(fileId: string): void {
    this.sidebar?.setActiveFile(fileId);
  }

  /** 进阶集成用；常规场景走 {@link runCommand} */
  getEditorView(): EditorView {
    return this.editor.getView();
  }

  runCommand(
    command: EditorCommand | string,
    payload?: unknown,
  ): boolean | Promise<boolean> {
    return executeCommand(this.editor.getView(), command, payload, {
      eventBus: this.eventBus,
      theme: this.theme,
    });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.eventBus.emit("editor:destroy", { el: this.cherryEl });
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
