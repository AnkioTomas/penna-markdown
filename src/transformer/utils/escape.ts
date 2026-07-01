/**
 * @file HTML 转义工具
 * @module transformer/utils/escape
 *
 * 渲染阶段将文本与属性值转义，防止 XSS。
 */

/**
 * 转义 HTML 特殊字符（&、<、>、"）。
 */
export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * CommonMark 行内文本转义（与 GFM 期望一致）。
 */
export function escapeText(text: string): string {
  return escapeHtml(text);
}

/** CommonMark 可被反斜杠转义的 ASCII 标点 */
export const ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;

export function isEscapable(ch: string): boolean {
  return ESCAPABLE.test(ch);
}

/**
 * 定界符前奇数个 `\` 表示该字符被转义。
 */
export function isEscaped(src: string, index: number): boolean {
  let n = 0;
  for (let i = index - 1; i >= 0 && src[i] === "\\"; i -= 1) n += 1;
  return n % 2 === 1;
}

/**
 * 解析行首 `\` 转义序列，返回字面量文本与下一游标。
 */
export function parseBackslash(
  src: string,
  index: number,
): { value: string; nextIndex: number } | null {
  if (src[index] !== "\\") return null;
  const next = src[index + 1];
  if (next === undefined) {
    return { value: "\\", nextIndex: index + 1 };
  }
  if (next === "\n") return null;
  if (isEscapable(next)) {
    return { value: next, nextIndex: index + 2 };
  }
  return { value: "\\", nextIndex: index + 1 };
}

/** 扫描时跳过单个字符或一个 `\` 转义序列。 */
export function skipTextUnit(src: string, index: number): number {
  return parseBackslash(src, index)?.nextIndex ?? index + 1;
}

/**
 * 生成可选的 HTML 属性片段（值非空时转义并输出）。
 */
export function htmlAttr(name: string, value: string): string {
  return value ? ` ${name}="${escapeHtml(value)}"` : "";
}
