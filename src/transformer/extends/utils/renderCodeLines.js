/**
 * @file 代码块逐行 HTML 渲染（含行号 / 行高亮 / 折叠）
 * @module transformer/extends/utils/renderCodeLines
 */

import { escapeHtml } from "@/transformer/utils/escape.js";
import {
  analyzeCollapsedCode,
  isFoldedCodeLine,
  shouldSkipCollapsedLine,
} from "@/transformer/extends/utils/collapsedCode.js";

/**
 * @param {number[]} highlightLines
 * @returns {Set<number>}
 */
function toHighlightSet(highlightLines) {
  return new Set(highlightLines);
}

/**
 * @param {string} lineHtml
 * @param {number} lineNumber
 * @param {Set<number>} highlightSet
 * @param {boolean} [folded=false]
 * @returns {string}
 */
export function wrapCodeLineHtml(lineHtml, lineNumber, highlightSet, folded = false) {
  const classes = ["line"];
  if (highlightSet.has(lineNumber)) {
    classes.push("cherry-code-block__line--highlighted");
  }
  if (folded) {
    classes.push("cherry-code-block__line--folded");
  }
  const body = lineHtml === "" ? " " : lineHtml;
  return `<span class="${classes.join(" ")}" data-line="${lineNumber}"><span class="cherry-code-block__ln" aria-hidden="true">${lineNumber}</span><span class="cherry-code-block__code">${body}</span></span>`;
}

/**
 * 从已渲染的行 DOM 还原源码（排除行号列）。
 *
 * @param {ParentNode} codeEl
 * @returns {string}
 */
export function readCodeLinesText(codeEl) {
  const lines = codeEl.querySelectorAll(".line");
  if (lines.length === 0) return codeEl.textContent ?? "";

  return [...lines]
    .map((line) => line.querySelector(".cherry-code-block__code")?.textContent ?? line.textContent ?? "")
    .join("\n");
}

/**
 * @typedef {Object} RenderCodeLinesResult
 * @property {string} html
 * @property {import('./collapsedCode.js').CollapsedCodeAnalysis} collapse
 */

/**
 * 将纯文本代码渲染为带行号的 span 列表。
 *
 * @param {string} content
 * @param {number[]} [highlightLines=[]]
 * @param {{ enabled?: boolean, maxLines?: number }} [collapse]
 * @returns {RenderCodeLinesResult}
 */
export function renderCodeLinesHtml(content, highlightLines = [], collapse = null) {
  const highlightSet = toHighlightSet(highlightLines);
  const lines = content.split("\n");
  const analysis = analyzeCollapsedCode(content, collapse ?? {});

  const html = lines
    .map((line, index) => {
      const lineNumber = index + 1;
      if (shouldSkipCollapsedLine(analysis, lineNumber)) return "";
      const folded = isFoldedCodeLine(analysis, lineNumber);
      return wrapCodeLineHtml(escapeHtml(line), lineNumber, highlightSet, folded);
    })
    .filter(Boolean)
    .join("");

  return { html, collapse: analysis };
}
