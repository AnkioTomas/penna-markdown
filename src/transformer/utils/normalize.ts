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
export function normalizeInnerLines(lines: string[]): string[] {
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
export function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t";
}

export function isBlank(char: string) {
  return char == " " || char == "\t" || char == "\n" || char == "\r";
}

/**
 * 高效判断字符串是否全为空白符（替代正则表达式或 .trim() === ""）
 * @param str 需要检查的字符串
 */
export function isBlankString(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char !== " " && char !== "\t" && char !== "\n" && char !== "\r") {
      return false;
    }
  }
  return true;
}

/**
 * 行内空白（含 form feed / vertical tab）。
 */
export function isInlineWhitespace(ch: string): boolean {
  return (
    ch === " " ||
    ch === "\t" ||
    ch === "\n" ||
    ch === "\r" ||
    ch === "\v" ||
    ch === "\f"
  );
}

/**
 * 定界符边界空白判定（缺失字符视为空白）。
 */
export function isDelimiterWhitespace(ch: string): boolean {
  return !ch || ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

/** Unicode 空白（含 NBSP，用于定界符 flanking） */
export function isUnicodeWhitespace(ch: string): boolean {
  return isDelimiterWhitespace(ch) || ch === "\u00A0";
}

/**
 * 规范化 reference link label（小写、合并连续空白）。
 */
export function normalizeLinkRefLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface SkipInlineWhitespaceOptions {
  /** 是否允许跳过换行 */
  allowNewline?: boolean;
  /** 最多跳过的换行数 */
  maxNewlines?: number;
}

/**
 * 跳过行内连续空白。
 */
export function skipInlineWhitespace(
  src: string,
  index: number,
  { allowNewline = false, maxNewlines = 1 }: SkipInlineWhitespaceOptions = {},
): number {
  let i = index;
  let newlineCount = 0;
  while (i < src.length) {
    const ch = src[i];
    if (isInlineWhitespace(ch) && ch !== "\n" && ch !== "\r") {
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (!allowNewline || newlineCount >= maxNewlines) break;
      newlineCount += 1;
      i += 1;
      if (ch === "\r" && src[i] === "\n") i += 1;
      continue;
    }
    break;
  }
  return i;
}
