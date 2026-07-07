import "./styles.scss";

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { requiredEl } from "../../_common/dom.js";
import { AstTreeView } from "./tree-view.js";
import { highlightJson } from "./json-highlight.js";
import testDoc from "../../../docs/test.md?raw";
import simpleDoc from "../../../docs/simple.md?raw";

const RENDER_DEBOUNCE_MS = 100;

const DOCS = {
  test: { label: "docs/test.md", markdown: testDoc },
  simple: { label: "docs/simple.md", markdown: simpleDoc },
} as const;

type DocId = keyof typeof DOCS;

const transformer = new TransformerEngine();

const markdownInput = requiredEl<HTMLTextAreaElement>("#markdown");
const astTree = requiredEl<HTMLElement>("#ast-tree");
const nodeDetail = requiredEl<HTMLElement>("#node-detail");
const copyDetailBtn = requiredEl<HTMLButtonElement>("#copy-detail");
const timing = requiredEl<HTMLElement>("#timing");
const expandDepth1Btn = requiredEl<HTMLButtonElement>("#expand-depth-1");
const expandDepth2Btn = requiredEl<HTMLButtonElement>("#expand-depth-2");
const expandAllBtn = requiredEl<HTMLButtonElement>("#expand-all");
const collapseAllBtn = requiredEl<HTMLButtonElement>("#collapse-all");
const filterInput = requiredEl<HTMLInputElement>("#type-filter");
const docSelect = requiredEl<HTMLSelectElement>("#doc-select");
const docLabel = requiredEl<HTMLElement>("#doc-label");

let expandDepth = 2;
let activeDocId: DocId = "test";

type SerializedNode = {
  type: string;
  length: number;
  value?: string;
  props?: Record<string, unknown>;
  children?: SerializedNode[];
};

function serializeProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    out[key] = key === "store" ? "[ParserStore]" : value;
  }
  return out;
}

function serializeNode(node: MarkdownNode): SerializedNode {
  const out: SerializedNode = {
    type: node.type,
    length: node.length,
  };
  if (node.value !== undefined) out.value = node.value;
  if (node.props && Object.keys(node.props).length > 0) {
    out.props = serializeProps(node.props);
  }
  if (Array.isArray(node.children)) {
    out.children = node.children.map(serializeNode);
  }
  return out;
}

function showNodeDetail(node: MarkdownNode): void {
  nodeDetail.innerHTML = highlightJson(serializeNode(node));
}

const treeView = new AstTreeView(astTree, {
  onSelect(node) {
    showNodeDetail(node);
  },
});

function setExpandDepth(depth: 1 | 2): void {
  expandDepth = depth;
  expandDepth1Btn.classList.toggle("active", depth === 1);
  expandDepth2Btn.classList.toggle("active", depth === 2);
  if (treeView.hasAst()) {
    treeView.expandToDepth(depth);
  }
}

function loadDoc(id: DocId): void {
  const doc = DOCS[id];
  activeDocId = id;
  docSelect.value = id;
  docLabel.textContent = doc.label;
  markdownInput.value = doc.markdown;
  renderNow();
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
    nodeDetail.textContent = "";
    timing.textContent = "— ms";
    return;
  }

  timing.textContent = `${(performance.now() - start).toFixed(2)} ms`;
  treeView.setAst(ast, expandDepth);
  showNodeDetail(ast);
}

let renderTimer = 0;
function scheduleRender(): void {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(renderNow, RENDER_DEBOUNCE_MS);
}

markdownInput.addEventListener("input", scheduleRender);

docSelect.addEventListener("change", () => {
  const id = docSelect.value as DocId;
  if (id in DOCS) loadDoc(id);
});

expandDepth1Btn.addEventListener("click", () => setExpandDepth(1));
expandDepth2Btn.addEventListener("click", () => setExpandDepth(2));
expandAllBtn.addEventListener("click", () => treeView.expandAll());
collapseAllBtn.addEventListener("click", () => treeView.collapseAll());

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

loadDoc(activeDocId);
