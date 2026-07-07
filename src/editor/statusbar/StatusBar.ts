import type { Theme } from "@/theme/Theme";

const ICON_SIDEBAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>`;
const ICON_EDIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const ICON_PREVIEW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const ICON_SPLIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path></svg>`;
const ICON_REFRESH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`;

export class StatusBar {
  private readonly leftEl: HTMLElement;
  private readonly rightEl: HTMLElement;
  private readonly countEl: HTMLElement;
  private readonly offs: Set<() => void> = new Set();
  
  private sidebarVisible = true;
  private layoutMode: "edit" | "preview" | "split" = "split";

  constructor(
    private readonly mount: HTMLElement,
    private readonly theme: Theme,
  ) {
    this.mount.classList.add("cherry-statusbar");

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

    // 监听 preview:rendered 或 editor:change
    this.offs.add(
      this.theme.on("editor:change", (payload) => {
        const { markdown } = payload as { markdown: string };
        this.updateStats(markdown);
      }),
    );
  }

  private initButtons() {
    const btnSidebar = document.createElement("button");
    btnSidebar.className = "cherry-statusbar-btn";
    btnSidebar.innerHTML = ICON_SIDEBAR;
    btnSidebar.title = "切换侧边栏";
    btnSidebar.onclick = () => {
      this.sidebarVisible = !this.sidebarVisible;
      this.theme.emit("cherry:sidebar", { show: this.sidebarVisible });
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
      this.theme.on("cherry:layout", (payload) => {
        const mode = (payload as any).mode;
        this.layoutMode = mode;
        const btns = this.leftEl.querySelectorAll(".cherry-statusbar-btn:not(:first-child)");
        btns.forEach(b => b.classList.remove("is-active"));
        if (mode === "edit") btnEdit.classList.add("is-active");
        else if (mode === "preview") btnPreview.classList.add("is-active");
        else btnSplit.classList.add("is-active");
      })
    );

    this.offs.add(
      this.theme.on("cherry:sidebar", (payload) => {
        const show = (payload as any).show;
        this.sidebarVisible = show;
        btnSidebar.classList.toggle("is-active", show);
      })
    );
  }

  private initRightButtons() {
    const btnRefresh = document.createElement("button");
    btnRefresh.className = "cherry-statusbar-btn";
    btnRefresh.innerHTML = ICON_REFRESH;
    btnRefresh.title = "强制全量刷新渲染";
    btnRefresh.onclick = () => {
      this.theme.emit("preview:force-refresh", {});
      
      const svg = btnRefresh.querySelector("svg");
      if (svg) {
        svg.style.transition = "transform 0.5s ease";
        svg.style.transform = `rotate(360deg)`;
        setTimeout(() => {
          svg.style.transition = "none";
          svg.style.transform = `rotate(0deg)`;
        }, 500);
      }
    };
    
    // Insert after countEl to be on the right side
    this.rightEl.appendChild(btnRefresh);
  }

  private switchLayout(mode: "edit" | "preview" | "split", _activeBtn: HTMLElement) {
    if (this.layoutMode === mode) return;
    this.theme.emit("cherry:layout", { mode });
  }

  private updateStats(text: string): void {
    const charCount = text.length;
    // 简单的字数统计（英文按空格分词，中文粗略按字算）
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    let wordCount = 0;
    
    for (const w of words) {
        // 如果包含中文字符，则中文字符每个算一个字，非中文部分算一个词
        const cnMatches = w.match(/[\u4e00-\u9fa5]/g);
        const cnCount = cnMatches ? cnMatches.length : 0;
        const nonCnPart = w.replace(/[\u4e00-\u9fa5]/g, '').trim();
        wordCount += cnCount + (nonCnPart.length > 0 ? 1 : 0);
    }

    this.countEl.textContent = `${wordCount} 词 · ${charCount} 字符`;
  }

  destroy(): void {
    for (const off of this.offs) off();
    this.offs.clear();
  }
}
