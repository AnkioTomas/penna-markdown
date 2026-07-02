import { createRenderer } from "@/renderer/index.js";
import type { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { requiredById } from "./dom.js";
import type { SyntaxExample } from "./syntax-example.js";
import type { CodeHighlightSetup } from "@/renderer/highlight/setup.js";

export interface SyntaxDemoConfig {
  examples: SyntaxExample[];
  transformer: TransformerEngine;
  highlight?: CodeHighlightSetup | null;
  /** 侧栏列表面板 id，默认 `syntax-list` */
  listId?: string;
  formatStatus?: (time: string) => string;
}

export interface SyntaxDemoApi {
  render: () => void;
  updateCurrentSyntax: () => void;
}

export function initSyntaxDemo({
  examples,
  transformer,
  highlight,
  listId = "syntax-list",
  formatStatus = (time) => time,
}: SyntaxDemoConfig): SyntaxDemoApi {
  const markdownInput = requiredById<HTMLTextAreaElement>("markdown-input");
  const preview = requiredById<HTMLElement>("preview");
  const htmlDisplay = requiredById<HTMLPreElement>("html-display");
  const markdownDisplay = requiredById<HTMLPreElement>("markdown-display");
  const syntaxList = requiredById<HTMLElement>(listId);
  const rerunBtn = requiredById<HTMLButtonElement>("rerun-btn");
  const statusEl = requiredById<HTMLElement>("status");

  const renderer = createRenderer({ mount: preview, transformer, highlight });

  let currentSyntaxIndex = 0;

  function render() {
    const md = markdownInput.value;
    const result = renderer.render(md);

    markdownDisplay.textContent = md;
    htmlDisplay.textContent = result.html;
    statusEl.textContent = formatStatus(new Date().toLocaleTimeString());
  }

  function updateCurrentSyntax() {
    syntaxList.querySelectorAll<HTMLElement>(".syntax-item").forEach((item, index) => {
      item.classList.toggle("active", index === currentSyntaxIndex);
    });

    markdownInput.value = examples[currentSyntaxIndex].markdown;
    render();
  }

  function renderSyntaxList() {
    syntaxList.replaceChildren();

    examples.forEach((syntax, index) => {
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

      syntaxList.append(item);
    });
  }

  renderSyntaxList();
  updateCurrentSyntax();

  markdownInput.addEventListener("input", render);
  rerunBtn.addEventListener("click", render);

  return { render, updateCurrentSyntax };
}
