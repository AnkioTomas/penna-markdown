/**
 * @file 按行语法高亮（配合行高亮 / 折叠标记）
 * @module renderer/utils/highlightByLines
 */

import type { CollapsedCodeAnalysis } from "@/transformer/extends/block/enhancedCode.js";
import {
  analyzeCollapsedCode,
  highlightCodeLinesHtml,
} from "@/transformer/extends/block/enhancedCode.js";
import type { HljsLike } from "@/transformer/extends/block/enhancedCode.js";

function readCollapseAnalysis(
  panel: HTMLElement | null | undefined,
  code: string,
): CollapsedCodeAnalysis | null {
  if (!panel || panel.dataset.cherryCollapsed !== "1") return null;
  const maxLines = Number.parseInt(panel.dataset.cherryCollapsedMax ?? "", 10);
  return analyzeCollapsedCode(code, {
    enabled: true,
    maxLines: Number.isNaN(maxLines) ? undefined : maxLines,
  });
}

export function highlightCodeByLines(
  hljs: HljsLike,
  code: string,
  lang: string,
  highlightLines: number[],
  panel: HTMLElement | null | undefined,
  collapse: CollapsedCodeAnalysis | null = null,
): string {
  const resolvedCollapse = collapse ?? readCollapseAnalysis(panel, code);
  return highlightCodeLinesHtml(hljs, code, lang, highlightLines, resolvedCollapse);
}
