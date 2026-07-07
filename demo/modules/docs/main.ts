import "./styles.scss";
import "../../_common/render-demo.scss";
import "../../_common/layout.scss";

import { createDemoTheme, setupPreviewThemeAndAppearance } from "../../_common/theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import { requiredEl } from "../../_common/dom.js";
import {
  buildDocTree,
  fetchDocContent,
  findDocFile,
  flattenDocTree,
  loadDocHref,
  normalizeDocHref,
  resolveDocLink,
  resolveDocsEntryHref,
  type DocTreeFile,
  type DocTreeNode,
} from "../../_common/api.js";

const DOCS_DIR = "/docs/";
const ACTIVE_KEY = "cherry-docs-demo-href";
const SCROLL_OFFSET = 72;

const docTreeEl = requiredEl<HTMLElement>("#doc-tree");
const docPathEl = requiredEl<HTMLElement>("#doc-path");
const preview = requiredEl<HTMLElement>("#preview");
const previewWrap = requiredEl<HTMLElement>("#preview-wrap");
const tocEl = requiredEl<HTMLElement>("#toc");
const timingEl = requiredEl<HTMLElement>("#timing");

const theme = createDemoTheme();
const renderer = new Renderer({ mount: preview, theme });

let docTree: DocTreeNode[] = [];
let activeHref = localStorage.getItem(ACTIVE_KEY) ?? "";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hrefToLabel(href: string): string {
  const base = DOCS_DIR.replace(/\/$/, "");
  return href.startsWith(base) ? href.slice(base.length + 1) || "docs/" : href;
}

function createFileLink(file: DocTreeFile): HTMLLIElement {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "doc-tree-link";
  btn.dataset.href = file.href;
  btn.textContent = file.name;
  btn.classList.toggle("is-active", normalizeDocHref(file.href) === normalizeDocHref(activeHref));
  btn.addEventListener("click", () => void loadDoc(file.href));
  li.appendChild(btn);
  return li;
}

function appendDocTreeNodes(nodes: DocTreeNode[], list: HTMLUListElement): void {
  for (const node of nodes) {
    if (node.kind === "file") {
      list.appendChild(createFileLink(node));
      continue;
    }

    const group = document.createElement("li");
    group.className = "doc-tree-group";

    const title = document.createElement("p");
    title.className = "doc-tree-group-title";
    title.textContent = node.name;

    if (node.indexHref) {
      title.classList.add("doc-tree-group-title--link");
      title.tabIndex = 0;
      title.role = "button";
      title.addEventListener("click", () => void loadDoc(node.indexHref!));
      title.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void loadDoc(node.indexHref!);
        }
      });
    }

    group.appendChild(title);

    const sub = document.createElement("ul");
    sub.className = "doc-tree-group-items";
    appendDocTreeNodes(node.children, sub);
    group.appendChild(sub);

    list.appendChild(group);
  }
}

function renderDocTree(nodes: DocTreeNode[], container: HTMLElement): void {
  const list = document.createElement("ul");
  list.className = "doc-tree-list";
  appendDocTreeNodes(nodes, list);
  container.replaceChildren(list);
}

function syncActiveTree(): void {
  const active = normalizeDocHref(activeHref);
  docTreeEl.querySelectorAll<HTMLButtonElement>(".doc-tree-link").forEach((btn) => {
    btn.classList.toggle("is-active", normalizeDocHref(btn.dataset.href ?? "") === active);
  });
}

function getScrollTop(el: HTMLElement, container: HTMLElement): number {
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return elRect.top - containerRect.top + container.scrollTop;
}

function updateActiveToc(): void {
  const links = [...tocEl.querySelectorAll<HTMLAnchorElement>(".docs-toc-link")];
  if (links.length === 0) return;

  const pos = previewWrap.scrollTop + SCROLL_OFFSET;
  let activeId = links[0]?.dataset.id ?? "";

  for (const link of links) {
    const id = link.dataset.id;
    if (!id) continue;
    const heading = document.getElementById(id);
    if (!heading || !preview.contains(heading)) continue;
    if (getScrollTop(heading, previewWrap) <= pos) {
      activeId = id;
    }
  }

  for (const link of links) {
    link.classList.toggle("is-active", link.dataset.id === activeId);
  }
}

function renderToc(): void {
  const flat = renderer.getTocFlat();
  if (flat.length === 0) {
    tocEl.innerHTML = '<p class="docs-toc-empty">当前页无标题</p>';
    return;
  }

  tocEl.innerHTML = flat
    .filter((item) => item.level >= 2)
    .map(
      (item) =>
        `<a class="docs-toc-link toc-h${item.level}" data-id="${escapeHtml(item.id)}" href="#${encodeURIComponent(item.id)}">${escapeHtml(item.text)}</a>`,
    )
    .join("");

  if (!tocEl.querySelector(".docs-toc-link")) {
    tocEl.innerHTML = '<p class="docs-toc-empty">当前页无二级标题</p>';
    return;
  }

  updateActiveToc();
}

async function loadDoc(href: string): Promise<void> {
  const resolved = await loadDocHref(href);
  if (!resolved) {
    preview.innerHTML = `<p class="docs-demo-error">文档不存在：${escapeHtml(href)}</p>`;
    return;
  }

  activeHref = resolved;
  localStorage.setItem(ACTIVE_KEY, activeHref);
  docPathEl.textContent = hrefToLabel(activeHref);
  syncActiveTree();

  preview.innerHTML = '<p class="docs-demo-hint">加载中…</p>';
  tocEl.innerHTML = "";

  try {
    const markdown = await fetchDocContent(resolved);
    const start = performance.now();
    renderer.render(markdown);
    timingEl.textContent = `${(performance.now() - start).toFixed(1)} ms`;
    previewWrap.scrollTop = 0;
    renderToc();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    preview.innerHTML = `<p class="docs-demo-error">加载失败：${escapeHtml(message)}</p>`;
    timingEl.textContent = "— ms";
    tocEl.innerHTML = "";
  }
}

async function pickInitialHref(): Promise<string> {
  if (activeHref) {
    const restored = await loadDocHref(activeHref);
    if (restored && findDocFile(docTree, restored)) return restored;
  }
  const entry = await resolveDocsEntryHref(DOCS_DIR);
  if (entry) return entry;
  const files = flattenDocTree(docTree);
  return files[0]?.href ?? "";
}

function handlePreviewClick(event: MouseEvent): void {
  const anchor = (event.target as Element).closest("a");
  if (!anchor || !preview.contains(anchor)) return;

  const href = anchor.getAttribute("href");
  if (!href) return;

  if (href.startsWith("#")) {
    event.preventDefault();
    const id = decodeURIComponent(href.slice(1));
    const target = document.getElementById(id);
    if (target && preview.contains(target)) {
      previewWrap.scrollTo({
        top: getScrollTop(target, previewWrap) - SCROLL_OFFSET + 8,
        behavior: "smooth",
      });
    }
    return;
  }

  const docHref = resolveDocLink(activeHref, href);
  if (!docHref || !docHref.startsWith(DOCS_DIR.replace(/\/$/, ""))) return;

  event.preventDefault();
  void loadDoc(docHref);
}

tocEl.addEventListener("click", (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>(".docs-toc-link");
  if (!link?.hash) return;
  const id = decodeURIComponent(link.hash.slice(1));
  const target = document.getElementById(id);
  if (!target || !preview.contains(target)) return;
  event.preventDefault();

  previewWrap.scrollTo({
    top: getScrollTop(target, previewWrap) - SCROLL_OFFSET + 8,
    behavior: "smooth",
  });

  tocEl.querySelectorAll(".docs-toc-link").forEach((el) => el.classList.remove("is-active"));
  link.classList.add("is-active");
});

preview.addEventListener("click", handlePreviewClick);
previewWrap.addEventListener("scroll", () => updateActiveToc(), { passive: true });

async function boot(): Promise<void> {
  setupPreviewThemeAndAppearance(theme, preview, previewWrap, {
    onThemeChange: () => {
      if (activeHref) void loadDoc(activeHref);
    },
  });

  try {
    docTree = await buildDocTree(DOCS_DIR);
  } catch (e) {
    console.error(e);
    docTree = [];
  }

  if (docTree.length === 0) {
    docTreeEl.innerHTML =
      '<p class="doc-tree-empty">未找到 docs 目录下的 Markdown 文件。<br>请通过 <code>pnpm demo</code> 启动开发服务器。</p>';
    preview.innerHTML = '<p class="docs-demo-hint">无文档可预览</p>';
    return;
  }

  renderDocTree(docTree, docTreeEl);

  const initial = await pickInitialHref();
  if (initial) await loadDoc(initial);
}

void boot();

declare global {
  interface Window {
    cherryDocsDemo?: {
      loadDoc: typeof loadDoc;
      getRenderer: () => Renderer;
    };
  }
}

window.cherryDocsDemo = {
  loadDoc,
  getRenderer: () => renderer,
};
