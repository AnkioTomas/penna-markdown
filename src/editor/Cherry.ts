import { Divider } from "@/editor/divider/Divider";
import { Editor } from "@/editor/editor/Editor";
import { Preview } from "@/editor/preview/Preview";
import { SideBar } from "@/editor/sidebar/SideBar";
import { Toolbar } from "@/editor/toolbar/Toolbar";
import { StatusBar } from "@/editor/statusbar/StatusBar";
import type { CherryOptions } from "@/editor/CherryOptions";
import type { EditorLayoutMode } from "@/editor/Layout";
import { printCherryLogo } from "@/editor/printLogo";
import { Theme } from "@/theme/Theme";

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
 * Cherry Markdown 编辑器。
 *
 * 在 rootEl 内构建完整 UI，子模块通过 Theme 事件总线通讯。
 */
export class Cherry {
  readonly theme: Theme;

  private readonly cherryEl: HTMLElement;
  private readonly toolbarEl: HTMLElement;
  private readonly bodyEl: HTMLElement;
  private readonly sidebarEl: HTMLElement;
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

  private readonly id: string | undefined;
  private destroyed = false;

  constructor(
    private readonly rootEl: HTMLElement,
    options: CherryOptions = {},
  ) {
    printCherryLogo();
    this.theme = new Theme(options.debug);
    this.id = options.id;

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
    this.sidebarEl = el("div", "cherry-sidebar");
    this.editorEl = el("div", "cherry-editor");
    this.dividerEl = el("div", "cherry-divider");
    this.previewEl = el("div", "cherry-preview");

    this.cherryEl.appendChild(this.toolbarEl);
    this.bodyEl.appendChild(this.sidebarEl);
    this.bodyEl.appendChild(this.editorEl);
    this.bodyEl.appendChild(this.dividerEl);
    this.bodyEl.appendChild(this.previewEl);
    this.cherryEl.appendChild(this.bodyEl);
    
    if (statusbar) {
      this.statusbarEl = el("div", "cherry-statusbar-wrap");
      this.cherryEl.appendChild(this.statusbarEl);
    }
    
    this.rootEl.appendChild(this.cherryEl);

    this.theme.setTheme(themeId, this.previewEl, this.cherryEl);
    this.theme.setLightDark(appearance);

    this.preview = new Preview(this.previewEl, this.theme, {
      inlineParsers: previewOptions.inlineParsers ?? transformer.inlineParsers,
      blockParsers: previewOptions.blockParsers ?? transformer.blockParsers,
    });

    this.editor = new Editor(
      this.editorEl,
      this.theme,
      {
        ...editorOptions,
        transformerEngineOptions:
          editorOptions.transformerEngineOptions ?? transformer,
      },
    );

    if (statusbar && this.statusbarEl) {
      this.statusbar = new StatusBar(this.statusbarEl, this.theme);
    }

    this.toolbar =
      options.toolbar === false
        ? null
        : new Toolbar({
            mount: this.toolbarEl,
            theme: this.theme,
            options: options.toolbar ?? {},
          });

    this.sidebar =
      options.sidebar === false
        ? null
        : new SideBar(this.sidebarEl, this.theme);

    this.divider = new Divider(this.dividerEl, this.theme);
    this.divider.setLayout(initialLayout);

    if (options.sidebar === false) {
      this.sidebarEl.style.display = "none";
    }

    const initialMarkdown = editorOptions.value ?? "";
    if (initialMarkdown) {
      this.theme.emit("editor:change", { markdown: initialMarkdown });
    }
    this.theme.on("cherry:layout", (payload: any) => {
      this.setLayout(payload.mode);
    });

    this.theme.on("cherry:sidebar", (payload: any) => {
      this.setSidebarVisible(payload.show);
    });

    queueMicrotask(() => {
      if (this.destroyed) return;
      this.theme.emit("cherry:layout", { mode: initialLayout });
      this.theme.emit("cherry:sidebar", { show: options.sidebar !== false });
      this.theme.emit("editor:ready", { id: this.id });
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

  setSidebarVisible(show: boolean): void {
    if (this.sidebar === null) return;
    this.sidebarEl.style.display = show ? "" : "none";
  }

  toggleSidebar(): void {
    this.setSidebarVisible(!this.isSidebarVisible());
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.theme.emit("editor:destroy", { id: this.id });
    this.toolbar?.destroy();
    this.sidebar?.destroy();
    this.divider.destroy();
    this.editor.destroy();
    this.preview.destroy();
    this.statusbar?.destroy();
    this.cherryEl.remove();
  }
}