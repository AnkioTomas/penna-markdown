/**
 * @file 块内容规范化工具
 * @module transformer/utils/normalize
 *
 * 提供块级内容规范化工具函数，消除多处重复实现。
 */

/**
 * 去掉数组首尾仅含空白的行，保留中间空行作段落分隔。
 *
 * @param {string[]} lines
 * @returns {string[]}
 */
export function normalizeInnerLines(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return lines.slice(start, end);
}
