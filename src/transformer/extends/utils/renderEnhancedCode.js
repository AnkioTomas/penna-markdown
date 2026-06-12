/**
 * @file 增强代码块 HTML 渲染
 * @module transformer/extends/utils/renderEnhancedCode
 */

import { escapeHtml } from "@/transformer/utils/escape.js";
import { formatHighlightLinesAttr } from "@/transformer/extends/utils/parseLineHighlight.js";
import { renderCodeLinesHtml } from "@/transformer/extends/utils/renderCodeLines.js";

/**
 * 渲染带顶栏（语言 / 标题 / 复制）、行高亮、折叠与可客户端高亮的围栏代码块。
 *
 * @param {{
 *   content?: string,
 *   lang?: string,
 *   title?: string,
 *   highlightLines?: number[],
 *   collapsedLines?: boolean,
 *   collapsedMaxLines?: number
 * }} node
 * @returns {string}
 */
export function renderEnhancedCodeBlock(node) {
  const lang = (node.lang ?? "").trim();
  const title = (node.title ?? "").trim();
  const content = node.content ?? "";
  const highlightLines = Array.isArray(node.highlightLines) ? node.highlightLines : [];
  const collapsedLines = Boolean(node.collapsedLines);
  const collapsedMaxLines =
    typeof node.collapsedMaxLines === "number" ? node.collapsedMaxLines : undefined;

  const classAttr = lang ? ` class="language-${escapeHtml(lang)}"` : "";
  const collapseOpts = collapsedLines
    ? { enabled: true, maxLines: collapsedMaxLines }
    : null;

  const rendered = renderCodeLinesHtml(content, highlightLines, collapseOpts);
  const codeBody = rendered.html;
  const collapseAnalysis = rendered.collapse;

  const codeHtml = `<pre class="cherry-code-block__pre cherry-code-block__pre--lines"><code${classAttr} data-cherry-code>${codeBody}</code></pre>`;

  const copyBtn =
    '<button type="button" class="cherry-copy-code-button" aria-label="复制代码" data-copied="已复制"></button>';

  const langLabel = lang
    ? `<span class="cherry-code-block__lang">${escapeHtml(lang)}</span>`
    : "";
  const titleLabel = title
    ? `<span class="cherry-code-block__title">${escapeHtml(title)}</span>`
    : "";
  const meta = `<div class="cherry-code-block__meta">${langLabel}${titleLabel}</div>`;
  const header = `<div class="cherry-code-block__header">${meta}${copyBtn}</div>`;

  const hasCollapse = Boolean(collapseAnalysis?.hasMore);
  const collapsedPanelClass = hasCollapse
    ? " cherry-code-block__panel--collapsible cherry-code-block__panel--collapsed"
    : "";
  const expandBtn = hasCollapse
    ? '<button type="button" class="cherry-code-block__expand" aria-expanded="false"><span class="cherry-code-block__expand-label">展开代码</span><span class="cherry-code-block__expand-icon" aria-hidden="true"></span></button>'
    : "";

  const langClass = lang ? ` language-${escapeHtml(lang)}` : "";
  const extAttr = lang ? ` data-ext="${escapeHtml(lang)}"` : "";
  const linesAttr =
    highlightLines.length > 0
      ? ` data-cherry-highlight-lines="${escapeHtml(formatHighlightLinesAttr(highlightLines))}"`
      : "";
  const collapseAttr = hasCollapse
    ? ` data-cherry-collapsed="1" data-cherry-collapsed-visible="${collapseAnalysis.visibleCount}" data-cherry-collapsed-max="${collapseAnalysis.maxLines}"${
        collapseAnalysis.markerLine
          ? ` data-cherry-collapsed-marker="${collapseAnalysis.markerLine}"`
          : ""
      }`
    : "";
  const panel = `<div class="cherry-code-block__panel${langClass}${collapsedPanelClass}"${extAttr}${linesAttr}${collapseAttr}>${header}${codeHtml}${expandBtn}</div>`;

  const titleAttr = title ? ` data-title="${escapeHtml(title)}"` : "";
  const langData = lang ? ` data-lang="${escapeHtml(lang)}"` : "";

  return `<div class="cherry-code-block"${titleAttr}${langData}>${panel}</div>`;
}
