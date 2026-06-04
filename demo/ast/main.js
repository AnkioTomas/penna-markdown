import { CherryTransformer } from "../../src/transformer/index.js";
import example from "./test.md?raw";

const transformer = new CherryTransformer();

const markdownInput = document.querySelector("#markdown");
const resetBtn = document.querySelector("#reset-btn");
const astTree = document.querySelector("#ast-tree");
const timing = document.querySelector("#timing");

markdownInput.value = example;

/** props 中已在节点上单独展示的字段 */
const SKIP_PROP_KEYS = new Set(["children", "value"]);

function previewText(text, max = 60) {
  const oneLine = String(text).replace(/\r\n/g, "\n").replace(/\n/g, "↵");
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

function formatPropValue(value) {
  if (value === null) return "null";
  if (typeof value === "string") return previewText(value, 120);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return previewText(JSON.stringify(value), 120);
  } catch {
    return String(value);
  }
}

/** 收集应在 UI 展示的 props（含提升到节点上的 length） */
function collectDisplayProps(node) {
  const raw = node.props ?? {};
  const rows = [];

  for (const [key, value] of Object.entries(raw)) {
    if (SKIP_PROP_KEYS.has(key)) continue;
    rows.push({ key, value });
  }

  if (node.length !== undefined && raw.length === undefined) {
    rows.push({ key: "length", value: node.length });
  }

  return rows;
}

function createPropsBlock(node) {
  const rows = collectDisplayProps(node);
  if (rows.length === 0) return null;

  const block = document.createElement("div");
  block.className = "node-props";

  for (const { key, value } of rows) {
    const row = document.createElement("div");
    row.className = "prop-row";

    const keyEl = document.createElement("span");
    keyEl.className = "prop-key";
    keyEl.textContent = key;

    const valEl = document.createElement("span");
    valEl.className = "prop-value";
    valEl.textContent = formatPropValue(value);
    if (typeof value === "string" && value.includes("\n")) {
      valEl.classList.add("prop-value-multiline");
    }

    row.append(keyEl, valEl);
    block.append(row);
  }

  return block;
}

function renderNode(node, isRoot = false) {
  const li = document.createElement("li");
  li.className = "ast-node";

  const header = document.createElement("div");
  header.className = "node-header";

  const typeTag = document.createElement("span");
  typeTag.className = "node-type";
  typeTag.textContent = node.type || "unknown";
  header.append(typeTag);

  if (node.value !== undefined) {
    const valueSpan = document.createElement("span");
    valueSpan.className = "node-value";
    valueSpan.textContent = `"${previewText(node.value)}"`;
    header.append(valueSpan);
  }

  const children = Array.isArray(node.children) ? node.children : [];

  if (children.length > 0) {
    li.classList.add("has-children");
    header.classList.add("has-toggle");

    const toggleIcon = document.createElement("span");
    toggleIcon.className = isRoot ? "toggle-icon expanded" : "toggle-icon";
    header.prepend(toggleIcon);

    const childCount = document.createElement("span");
    childCount.className = "child-count";
    childCount.textContent = `${children.length}`;
    header.append(childCount);
  } else {
    const spacer = document.createElement("span");
    spacer.className = "toggle-spacer";
    header.prepend(spacer);
  }

  li.append(header);

  const propsBlock = createPropsBlock(node);
  if (propsBlock) {
    li.append(propsBlock);
  }

  if (children.length > 0) {
    const ul = document.createElement("ul");
    ul.className = "tree-children";
    if (!isRoot) {
      li.classList.add("collapsed");
      ul.style.display = "none";
    }
    for (const child of children) {
      ul.appendChild(renderNode(child));
    }
    li.append(ul);
  }

  return li;
}

astTree.addEventListener("click", (e) => {
  const header = e.target.closest(".node-header.has-toggle");
  if (!header) return;

  const li = header.closest(".ast-node");
  const ul = li?.querySelector(":scope > .tree-children");
  const icon = header.querySelector(".toggle-icon");
  if (!ul || !icon) return;

  const expanded = icon.classList.toggle("expanded");
  ul.style.display = expanded ? "block" : "none";
  li.classList.toggle("collapsed", !expanded);
});

function renderTree(ast) {
  astTree.replaceChildren();
  const ul = document.createElement("ul");
  ul.className = "tree-root";
  ul.appendChild(renderNode(ast, true));
  astTree.appendChild(ul);
}

function renderNow() {
  const md = markdownInput.value ?? "";
  const start = performance.now();

  let ast;
  try {
    ast = transformer.parse(md).ast;
  } catch (e) {
    astTree.innerHTML = `<div class="error-msg">解析错误: ${e.message}</div>`;
    timing.textContent = "解析耗时: -";
    return;
  }

  timing.textContent = `解析耗时: ${(performance.now() - start).toFixed(3)} ms`;
  renderTree(ast);
}

let timer = 0;
markdownInput.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(renderNow, 100);
});

resetBtn.addEventListener("click", () => {
  markdownInput.value = example;
  renderNow();
});

renderNow();
window.cherryAstDemo = { transformer, renderNow };
