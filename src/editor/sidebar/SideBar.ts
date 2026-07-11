import type { EventBus } from "@/core/event/EventBus";
import type { SideBarOptions, CherryFileItem } from "./SideBarOptions";
import type { TocItem } from "@/renderer/toc/TocItem.js";

export class SideBar {
  private readonly tabsEl: HTMLElement;
  private readonly filePanelEl: HTMLElement;
  private readonly tocPanelEl: HTMLElement;
  private readonly offs: Set<() => void> = new Set();
  private activeTab: "file" | "toc" = "toc";
  private activeFileId: string | null = null;

  constructor(
    private readonly mount: HTMLElement,
    private readonly eventBus: EventBus,
    private readonly options: SideBarOptions = {},
  ) {
    this.mount.replaceChildren();

    // Create Tabs
    this.tabsEl = document.createElement("div");
    this.tabsEl.className = "cherry-sidebar-tabs";

    const btnFile = document.createElement("button");
    btnFile.className = "cherry-sidebar-tab";
    btnFile.textContent = "文件";
    btnFile.onclick = () => this.switchTab("file");

    const btnToc = document.createElement("button");
    btnToc.className = "cherry-sidebar-tab";
    btnToc.textContent = "大纲";
    btnToc.onclick = () => this.switchTab("toc");

    this.tabsEl.appendChild(btnFile);
    this.tabsEl.appendChild(btnToc);

    // Panels
    const panelsEl = document.createElement("div");
    panelsEl.className = "cherry-sidebar-panels";

    this.filePanelEl = document.createElement("div");
    this.filePanelEl.className = "cherry-sidebar-panel cherry-sidebar-file";

    this.tocPanelEl = document.createElement("div");
    this.tocPanelEl.className = "cherry-sidebar-panel cherry-sidebar-toc";

    panelsEl.appendChild(this.filePanelEl);
    panelsEl.appendChild(this.tocPanelEl);

    // If fetchFiles is missing, hide tabs and file panel
    if (!this.options.fetchFiles) {
      this.tabsEl.style.display = "none";
    } else {
      this.mount.appendChild(this.tabsEl);
      this.loadFiles();
    }

    this.mount.appendChild(panelsEl);
    this.switchTab(this.options.fetchFiles ? "file" : "toc");

    // Listen to TOC updates
    this.offs.add(
      this.eventBus.on("preview:rendered", (payload) => {
        const toc = (payload as { toc?: TocItem[] }).toc;
        if (toc) {
          this.renderToc(toc);
        }
      }),
    );
  }

  private switchTab(tab: "file" | "toc") {
    this.activeTab = tab;
    const btns = this.tabsEl.querySelectorAll(".cherry-sidebar-tab");
    btns[0]?.classList.toggle("is-active", tab === "file");
    btns[1]?.classList.toggle("is-active", tab === "toc");

    this.filePanelEl.style.display = tab === "file" ? "" : "none";
    this.tocPanelEl.style.display = tab === "toc" ? "" : "none";
  }

  private async loadFiles() {
    if (!this.options.fetchFiles) return;
    this.filePanelEl.innerHTML =
      '<div class="cherry-sidebar-loading">加载中...</div>';
    try {
      const files = await this.options.fetchFiles();
      this.renderFiles(files);
    } catch (e) {
      this.filePanelEl.innerHTML =
        '<div class="cherry-sidebar-error">加载失败</div>';
    }
  }

  private renderFiles(files: CherryFileItem[]) {
    this.filePanelEl.replaceChildren();
    for (const file of files) {
      const itemEl = document.createElement("div");
      itemEl.className = "cherry-file-item";
      itemEl.dataset.fileId = file.id;
      if (file.id === this.activeFileId) {
        itemEl.classList.add("is-active");
      }
      itemEl.onclick = () => {
        this.setActiveFile(file.id);
        if (this.options.onFileClick) this.options.onFileClick(file.id);
      };

      const topEl = document.createElement("div");
      topEl.className = "cherry-file-top";

      const titleEl = document.createElement("div");
      titleEl.className = "cherry-file-title";
      titleEl.textContent = file.title;

      const timeEl = document.createElement("div");
      timeEl.className = "cherry-file-time";
      timeEl.textContent = file.updateTime;

      topEl.appendChild(titleEl);
      topEl.appendChild(timeEl);

      const summaryEl = document.createElement("div");
      summaryEl.className = "cherry-file-summary";
      summaryEl.textContent = file.summary;

      itemEl.appendChild(topEl);
      itemEl.appendChild(summaryEl);
      this.filePanelEl.appendChild(itemEl);
    }
  }

  private renderToc(toc: TocItem[]) {
    this.tocPanelEl.replaceChildren();

    if (toc.length === 0) {
      this.tocPanelEl.innerHTML =
        '<div class="cherry-sidebar-empty">暂无大纲</div>';
      return;
    }

    const renderNode = (item: TocItem, parentEl: HTMLElement) => {
      const el = document.createElement("div");
      el.className = "cherry-toc-item";
      el.style.paddingLeft = `${(item.level - 1) * 12 + 16}px`;
      el.textContent = item.text;

      el.onclick = () => {
        this.eventBus.emit("sidebar:toc-click", { id: item.id });
      };

      parentEl.appendChild(el);
      for (const child of item.children) {
        renderNode(child, parentEl);
      }
    };

    for (const rootItem of toc) {
      renderNode(rootItem, this.tocPanelEl);
    }
  }

  setActiveFile(fileId: string): void {
    this.activeFileId = fileId;
    for (const el of this.filePanelEl.querySelectorAll<HTMLElement>(
      ".cherry-file-item",
    )) {
      el.classList.toggle("is-active", el.dataset.fileId === fileId);
    }
  }

  destroy(): void {
    for (const off of this.offs) off();
    this.offs.clear();
  }
}
