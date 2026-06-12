/**
 * @file 按行语法高亮（配合行高亮 / 折叠标记）
 * @module renderer/utils/highlightByLines
 */

import {
  analyzeCollapsedCode,
  isFoldedCodeLine,
  shouldSkipCollapsedLine,
} from "@/transformer/extends/utils/collapsedCode.js";
import { wrapCodeLineHtml } from "@/transformer/extends/utils/renderCodeLines.js";

/**
 * @param {HTMLElement | null | undefined} panel
 * @returns {import('@/transformer/extends/utils/collapsedCode.js').CollapsedCodeAnalysis | null}
 */
function readCollapseAnalysis(panel, code) {
  if (!panel || panel.dataset.cherryCollapsed !== "1") return null;
  const maxLines = Number.parseInt(panel.dataset.cherryCollapsedMax ?? "", 10);
  return analyzeCollapsedCode(code, {
    enabled: true,
    maxLines: Number.isNaN(maxLines) ? undefined : maxLines,
  });
}

/**
 * @param {import('highlight.js').default} hljs
 * @param {string} code
 * @param {string} lang
 * @param {number[]} highlightLines
 * @param {HTMLElement | null | undefined} [panel]
 * @returns {string}
 */
export function highlightCodeByLines(hljs, code, lang, highlightLines, panel) {
  const highlightSet = new Set(highlightLines);
  const lines = code.split("\n");
  const collapse = readCollapseAnalysis(panel, code);

  return lines
    .map((line, index) => {
      const lineNumber = index + 1;
      if (collapse && shouldSkipCollapsedLine(collapse, lineNumber)) return "";

      let inner = line;
      if (lang && hljs.getLanguage(lang)) {
        inner = hljs.highlight(line, { language: lang, ignoreIllegals: true }).value;
      } else if (line) {
        inner = hljs.highlightAuto(line, { ignoreIllegals: true }).value;
      }

      const folded = collapse ? isFoldedCodeLine(collapse, lineNumber) : false;
      return wrapCodeLineHtml(inner, lineNumber, highlightSet, folded);
    })
    .filter(Boolean)
    .join("");
}
