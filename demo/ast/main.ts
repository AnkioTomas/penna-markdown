import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { requiredEl } from "../dom.js";
import { AstTreeView } from "./tree-view.js";
import { highlightJson } from "./json-highlight.js";
import initialDoc from "../test.md?raw";

const DOC_LABEL = "demo/test.md";
const SAVE_URL = "/__ast/save-doc";
const RENDER_DEBOUNCE_MS = 100;

const transformer = new TransformerEngine();

const markdownInput = requiredEl<HTMLTextAreaElement>("#markdown");
const saveStatus = requiredEl<HTMLElement>("#save-status");
const astTree = requiredEl<HTMLElement>("#ast-tree");
const nodeDetail = requiredEl<HTMLElement>("#node-detail");
const copyDetailBtn = requiredEl<HTMLButtonElement>("#copy-detail");
const timing = requiredEl<HTMLElement>("#timing");
const expandAllBtn = requiredEl<HTMLButtonElement>("#expand-all");
const collapseAllBtn = requiredEl<HTMLButtonElement>("#collapse-all");
const expandDepthBtn = requiredEl<HTMLButtonElement>("#expand-depth");
const filterInput = requiredEl<HTMLInputElement>("#type-filter");

markdownInput.value = initialDoc;

type SerializedNode = Record<string, unknown> & {
  type: string;
  children?: SerializedNode[];
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

let savedContent = initialDoc;
let saving = false;

function setSaveStatus(text: string, state: SaveState = "idle"): void {
  saveStatus.textContent = text;
  saveStatus.classList.remove("is-dirty", "is-saving", "is-saved", "is-error");
  if (state === "dirty") saveStatus.classList.add("is-dirty");
  if (state === "saving") saveStatus.classList.add("is-saving");
  if (state === "saved") saveStatus.classList.add("is-saved");
  if (state === "error") saveStatus.classList.add("is-error");
}

function isDirty(): boolean {
  return markdownInput.value !== savedContent;
}

function refreshSaveStatus(): void {
  if (saving) return;
  if (isDirty()) {
    setSaveStatus(`未保存 · 失焦后写回 ${DOC_LABEL}`, "dirty");
    return;
  }
  setSaveStatus(DOC_LABEL, "idle");
}

async function saveDocument(): Promise<void> {
  if (!isDirty() || saving) return;

  const content = markdownInput.value;
  saving = true;
  setSaveStatus("写回中…", "saving");

  try {
    const res = await fetch(SAVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    savedContent = content;
    setSaveStatus(`已写回 ${DOC_LABEL}`, "saved");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setSaveStatus(`保存失败：${message}`, "error");
  } finally {
    saving = false;
    if (isDirty()) {
      refreshSaveStatus();
    }
  }
}

function showNodeDetail(node: MarkdownNode): void {
  nodeDetail.innerHTML = highlightJson(serializeNode(node));
}

const treeView = new AstTreeView(astTree, {
  onSelect(node) {
    showNodeDetail(node);
  },
});

/** 调试展示用：序列化 AST 节点字段 */
function serializeNode(node: MarkdownNode): SerializedNode {
  const out: SerializedNode = { type: node.type };
  if (node.value !== undefined) out.value = node.value;
  if (node.length !== undefined) out.length = node.length;
  if (Array.isArray(node.children)) {
    out.children = node.children.map(serializeNode);
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "type" || key === "children" || key === "value" || key === "length") {
      continue;
    }
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function renderNow(): void {
  const md = markdownInput.value;
  const start = performance.now();

  let ast: MarkdownNode;
  try {
    ast = transformer.parse(md);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    astTree.innerHTML = `<div class="error-msg">解析错误: ${message}</div>`;
    nodeDetail.innerHTML = "";
    timing.textContent = "解析耗时: -";
    return;
  }

  timing.textContent = `${(performance.now() - start).toFixed(2)} ms`;
  treeView.setAst(ast);
  showNodeDetail(ast);
}

let renderTimer = 0;
function scheduleRender(): void {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(renderNow, RENDER_DEBOUNCE_MS);
}

markdownInput.addEventListener("input", () => {
  scheduleRender();
  refreshSaveStatus();
});

markdownInput.addEventListener("blur", () => {
  void saveDocument();
});

expandAllBtn.addEventListener("click", () => treeView.expandAll());
collapseAllBtn.addEventListener("click", () => treeView.collapseAll());
expandDepthBtn.addEventListener("click", () => treeView.expandToDepth(2));

filterInput.addEventListener("input", () => {
  treeView.setFilter(filterInput.value);
});

copyDetailBtn.addEventListener("click", async () => {
  const text = nodeDetail.textContent ?? "";
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyDetailBtn.textContent = "已复制";
    setTimeout(() => {
      copyDetailBtn.textContent = "复制";
    }, 1200);
  } catch {
    copyDetailBtn.textContent = "失败";
  }
});

renderNow();
refreshSaveStatus();

window.cherryAstDemo = { transformer, renderNow, treeView, saveDocument };
