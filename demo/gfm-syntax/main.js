import { createTransformer } from "@/transformer/index.js";
import { gfmSyntaxExamples } from "./examples/index.js";

const markdownInput = document.getElementById("markdown-input");
const preview = document.getElementById("preview");
const htmlDisplay = document.getElementById("html-display");
const markdownDisplay = document.getElementById("markdown-display");
const syntaxList = document.getElementById("syntax-list");
const rerunBtn = document.getElementById("rerun-btn");
const statusEl = document.getElementById("status");

const transformer = createTransformer();

const DEFAULT_MARKDOWN = `# GFM 语法演示

Cherry Markdown Next 内置 **GFM**（GitHub Flavored Markdown）解析器。

## 常用语法

- **强调**：*斜体*、**粗体**、~~删除线~~
- [链接](https://github.github.com/gfm/)
- 围栏代码块与表格

| 类型 | 说明 |
| --- | --- |
| 块级 | 标题、引用、列表、代码、表格 |
| 行内 | 链接、图片、强调、自动链接 |

> 左侧选择单项语法查看示例；右侧可编辑 Markdown 实时预览。

---

自动链接：<https://example.com>
`;

let currentSyntaxIndex = 0;

function normalizeHtml(html) {
  return String(html).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function compareExpected(actual, expected) {
  if (!expected.trim()) return { ok: true, demo: true };
  const ok = normalizeHtml(actual) === normalizeHtml(expected);
  return { ok, demo: false };
}

function render() {
  const md = markdownInput.value;
  const { html } = transformer.render(md);
  const current = gfmSyntaxExamples[currentSyntaxIndex];
  const check = compareExpected(html, current.expected ?? "");

  preview.innerHTML = html;
  markdownDisplay.textContent = md;
  htmlDisplay.textContent = html;

  const badge = check.demo ? "演示" : check.ok ? "通过" : "失败";
  statusEl.textContent = `GFM 内置语法 · ${badge} · ${new Date().toLocaleTimeString()}`;
  statusEl.classList.toggle("fail", !check.ok && !check.demo);
}

function updateCurrentSyntax() {
  const items = syntaxList.querySelectorAll(".syntax-item");
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentSyntaxIndex);
  });

  const current = gfmSyntaxExamples[currentSyntaxIndex];
  markdownInput.value = current.markdown;
  render();
}

function renderSyntaxList() {
  syntaxList.innerHTML = "";

  gfmSyntaxExamples.forEach((syntax, index) => {
    const item = document.createElement("div");
    item.className = "syntax-item";
    if (index === currentSyntaxIndex) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <div class="syntax-name">${syntax.name}</div>
      <div class="syntax-desc">${syntax.desc}</div>
    `;

    item.addEventListener("click", () => {
      currentSyntaxIndex = index;
      updateCurrentSyntax();
    });

    syntaxList.appendChild(item);
  });
}

markdownInput.value = DEFAULT_MARKDOWN;
renderSyntaxList();
updateCurrentSyntax();

markdownInput.addEventListener("input", render);
rerunBtn.addEventListener("click", render);

window.cherryGfmSyntaxDemo = { render, updateCurrentSyntax, transformer };
