import { createTransformer } from "../../src/transformer/index.js";
import { AstTreeView } from "./tree-view.js";
import { highlightJson } from "./json-highlight.js";
import example from "../test.md?raw";

const transformer = createTransformer();

const markdownInput = document.querySelector("#markdown");
const resetBtn = document.querySelector("#reset-btn");
const astTree = document.querySelector("#ast-tree");
const nodeDetail = document.querySelector("#node-detail");
const copyDetailBtn = document.querySelector("#copy-detail");
const timing = document.querySelector("#timing");
const expandAllBtn = document.querySelector("#expand-all");
const collapseAllBtn = document.querySelector("#collapse-all");
const expandDepthBtn = document.querySelector("#expand-depth");
const filterInput = document.querySelector("#type-filter");

markdownInput.value = example;

function showNodeDetail(node) {
  nodeDetail.innerHTML = highlightJson(serializeNode(node));
}

const treeView = new AstTreeView(astTree, {
  onSelect(node) {
    showNodeDetail(node);
  },
});

/** 调试展示用：序列化 AST 节点字段 */
function serializeNode(node) {
  const out = { type: node.type };
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

function renderNow() {
  const md = markdownInput.value ?? "";
  const start = performance.now();

  let ast;
  try {
    ast = transformer.parse(md).ast;
  } catch (e) {
    astTree.innerHTML = `<div class="error-msg">解析错误: ${e.message}</div>`;
    nodeDetail.innerHTML = "";
    timing.textContent = "解析耗时: -";
    return;
  }

  timing.textContent = `${(performance.now() - start).toFixed(2)} ms`;
  treeView.setAst(ast);
  showNodeDetail(ast);
}

let timer = 0;
markdownInput.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(renderNow, 100);
});

resetBtn.addEventListener("click", () => {
  markdownInput.value = example;
  filterInput.value = "";
  treeView.setFilter("");
  renderNow();
});

expandAllBtn.addEventListener("click", () => treeView.expandAll());
collapseAllBtn.addEventListener("click", () => treeView.collapseAll());
expandDepthBtn.addEventListener("click", () => treeView.expandToDepth(2));

filterInput.addEventListener("input", () => {
  treeView.setFilter(filterInput.value);
});

copyDetailBtn?.addEventListener("click", async () => {
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
window.cherryAstDemo = { transformer, renderNow, treeView };
