/**
 * @file 代码块行高亮区间解析
 * @module transformer/extends/utils/parseLineHighlight
 */

/**
 * 解析 `{1,4,6-8}` 形式的行号集合（1-based）。
 *
 * @param {string} spec
 * @returns {number[]}
 */
export function parseLineHighlightSpec(spec) {
  const lines = new Set();

  for (const part of spec.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (part.includes("-")) {
      const [rawStart, rawEnd] = part.split("-", 2);
      const start = Number.parseInt(rawStart ?? "", 10);
      const end = Number.parseInt(rawEnd ?? "", 10);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      const from = Math.min(start, end);
      const to = Math.max(start, end);
      for (let i = from; i <= to; i += 1) lines.add(i);
    } else {
      const n = Number.parseInt(part, 10);
      if (!Number.isNaN(n)) lines.add(n);
    }
  }

  return [...lines].sort((a, b) => a - b);
}

/**
 * 合并多段行号区间为去重排序数组。
 *
 * @param {...(number[] | string)} specs
 * @returns {number[]}
 */
export function mergeLineHighlightSpecs(...specs) {
  const lines = new Set();
  for (const spec of specs) {
    if (Array.isArray(spec)) {
      for (const n of spec) lines.add(n);
    } else if (typeof spec === "string" && spec.trim()) {
      for (const n of parseLineHighlightSpec(spec)) lines.add(n);
    }
  }
  return [...lines].sort((a, b) => a - b);
}

/**
 * @param {string | undefined} raw
 * @returns {number[]}
 */
export function parseHighlightLinesAttr(raw) {
  if (!raw?.trim()) return [];
  return mergeLineHighlightSpecs(raw);
}

/**
 * @param {number[]} lines
 * @returns {string}
 */
export function formatHighlightLinesAttr(lines) {
  return lines.join(",");
}
