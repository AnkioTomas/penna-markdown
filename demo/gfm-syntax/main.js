import {
  getAvailableExtensions,
  createTransformerWithExtensions,
} from "@/transformer/index.js";
import { hydrateCherryTheme } from "@/renderer/cherryTheme.js";
import "../highlight-setup.js";
import "../theme-watch.js";
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

function render() {
  const md = markdownInput.value;
  const { html } = transformer.render(md);

  preview.innerHTML = html;
  hydrateCherryTheme(preview);
  markdownDisplay.textContent = md;
  htmlDisplay.textContent = html;

  const extLabel = extensionNames.length ? `${extensionNames.length} 个扩展` : "无扩展";
  statusEl.textContent = `GFM · ${extLabel} · ${new Date().toLocaleTimeString()}`;
}

function updateCurrentSyntax() {
  const items = syntaxList.querySelectorAll(".syntax-item");
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentSyntaxIndex);
  });

  markdownInput.value = gfmSyntaxExamples[currentSyntaxIndex].markdown;
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
