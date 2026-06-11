import {
  getAvailableExtensions,
  createTransformerWithExtensions,
} from "@/transformer/index.js";
import { gfmSyntaxExamples } from "./examples/index.js";

const markdownInput = document.getElementById("markdown-input");
const preview = document.getElementById("preview");
const htmlDisplay = document.getElementById("html-display");
const markdownDisplay = document.getElementById("markdown-display");
const syntaxList = document.getElementById("syntax-list");
const rerunBtn = document.getElementById("rerun-btn");
const statusEl = document.getElementById("status");

const extensionNames = getAvailableExtensions();
const transformer = createTransformerWithExtensions(extensionNames);

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
  const extLabel = extensionNames.length ? `${extensionNames.length} 个扩展` : "无扩展";
  statusEl.textContent = `GFM · ${extLabel} · ${badge} · ${new Date().toLocaleTimeString()}`;
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

renderSyntaxList();
updateCurrentSyntax();

markdownInput.addEventListener("input", render);
rerunBtn.addEventListener("click", render);

window.cherryGfmSyntaxDemo = { render, updateCurrentSyntax, transformer };
