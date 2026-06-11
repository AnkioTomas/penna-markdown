/**
 * @file 代码块折叠行分析
 * @module transformer/extends/utils/collapsedCode
 */

/** 无 `...` 标记时的默认可见行数 */
export const DEFAULT_COLLAPSED_VISIBLE_LINES = 10;

/**
 * @typedef {Object} CollapsedCodeAnalysis
 * @property {boolean} enabled
 * @property {boolean} hasMore
 * @property {number} visibleCount - 折叠时可见的最后一行号（1-based）
 * @property {number | null} markerLine - `...` 占位行号；无则为 null
 * @property {number} maxLines
 */

/**
 * @param {string} line
 * @returns {boolean}
 */
export function isCollapseMarkerLine(line) {
  return /^\s*\.\.\.(?:\s|$)/.test(line);
}

/**
 * 分析折叠代码块应展示/隐藏的行。
 *
 * - 存在 `...` 行：该行之前全部可见，之后全部折叠，占位行不输出
 * - 否则：默认展示前 {@link DEFAULT_COLLAPSED_VISIBLE_LINES} 行，其余折叠
 *
 * @param {string} content
 * @param {{ enabled?: boolean, maxLines?: number }} [options]
 * @returns {CollapsedCodeAnalysis}
 */
export function analyzeCollapsedCode(content, options = {}) {
  const lines = content.split("\n");
  const maxLines = options.maxLines ?? DEFAULT_COLLAPSED_VISIBLE_LINES;

  if (!options.enabled) {
    return {
      enabled: false,
      hasMore: false,
      visibleCount: lines.length,
      markerLine: null,
      maxLines,
    };
  }

  const markerIndex = lines.findIndex((line) => isCollapseMarkerLine(line));
  if (markerIndex >= 0) {
    const hiddenCount = lines.length - markerIndex - 1;
    return {
      enabled: true,
      hasMore: hiddenCount > 0,
      visibleCount: markerIndex,
      markerLine: markerIndex + 1,
      maxLines,
    };
  }

  const hasMore = lines.length > maxLines;
  return {
    enabled: true,
    hasMore,
    visibleCount: hasMore ? maxLines : lines.length,
    markerLine: null,
    maxLines,
  };
}

/**
 * @param {CollapsedCodeAnalysis} analysis
 * @param {number} lineNumber - 1-based
 * @returns {boolean}
 */
export function isFoldedCodeLine(analysis, lineNumber) {
  if (!analysis.enabled || !analysis.hasMore) return false;
  if (analysis.markerLine !== null) {
    return lineNumber > analysis.visibleCount;
  }
  return lineNumber > analysis.visibleCount;
}

/**
 * @param {CollapsedCodeAnalysis} analysis
 * @param {number} lineNumber - 1-based
 * @returns {boolean}
 */
export function shouldSkipCollapsedLine(analysis, lineNumber) {
  return analysis.markerLine !== null && lineNumber === analysis.markerLine;
}
