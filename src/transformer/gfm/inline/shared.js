/**
 * 行内解析共享工具
 */

/**
 * 定界符前奇数个 `\` 表示该字符被转义。
 */
export function isEscaped(src, index) {
  let n = 0;
  for (let i = index - 1; i >= 0 && src[i] === "\\"; i -= 1) n += 1;
  return n % 2 === 1;
}

/**
 * 从 index 起用正则匹配定界行内语法；捕获组 1 为内部文本。
 *
 * @param {RegExp} re - 须以 ^ 锚定，且含 (.+?) 等内容捕获组
 */
export function matchDelimited(src, index, re) {
  if (isEscaped(src, index)) return null;
  const m = src.slice(index).match(re);
  if (!m || m[1] == null || m[1].length === 0) return null;
  return { inner: m[1], length: m[0].length };
}
