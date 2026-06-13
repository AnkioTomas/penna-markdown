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

/**
 * 判断字符是否为空白（空格或制表符）。
 *
 * @param {string} ch
 * @returns {boolean}
 */
export function isWhitespace(ch) {
  return ch === " " || ch === "\t";
}

export function isBlank(char:string) {
  return char == ' ' || char == '\t' || char == '\n' || char == '\r';
}

/**
 * 高效判断字符串是否全为空白符（替代正则表达式或 .trim() === ""）
 * @param str 需要检查的字符串
 */
export function isBlankString(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
      return false;
    }
  }
  return true;
}