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

/** GFM destination / title 中可反斜杠转义的 ASCII 标点 */
export function isAsciiPunct(ch) {
  return /[!-/:-@\[-`{-~]/.test(ch);
}

/** 解析 link destination 后去掉反斜杠转义 */
export function unescapeHref(href) {
  let out = "";
  for (let i = 0; i < href.length; i++) {
    if (href[i] === "\\" && i + 1 < href.length && isAsciiPunct(href[i + 1])) {
      out += href[i + 1];
      i += 1;
    } else {
      out += href[i];
    }
  }
  return out;
}

/**
 * 解析 `<...>` destination；闭合 `>` 必须未转义（Example 502）。
 * @returns {{ href: string, next: number } | null}
 */
export function findUnescapedAngleClose(src, openIndex) {
  let k = openIndex + 1;
  while (k < src.length) {
    if (src[k] === "\n") return -1;
    if (src[k] === "\\") {
      if (k + 1 < src.length && isAsciiPunct(src[k + 1])) {
        k += 2;
        continue;
      }
      k += 1;
      continue;
    }
    if (src[k] === ">") return k;
    if (src[k] === "<") return -1;
    k += 1;
  }
  return -1;
}

export function parseAngleDestination(src, start) {
  const close = findUnescapedAngleClose(src, start);
  if (close === -1) return null;
  return { href: src.slice(start + 1, close), next: close + 1 };
}

/**
 * 解析非尖括号 destination；转义括号不参与平衡计数（Example 504–508）。
 * @returns {{ href: string, next: number }}
 */
export function parsePlainDestination(src, start) {
  let k = start;
  let pLevel = 0;
  while (k < src.length) {
    if (src[k] === "\\") {
      if (k + 1 < src.length && isAsciiPunct(src[k + 1])) {
        k += 2;
        continue;
      }
      k += 1;
      continue;
    }
    const char = src[k];
    if (char === "(") pLevel += 1;
    else if (char === ")") {
      if (pLevel === 0) break;
      pLevel -= 1;
    } else if (/[ \t\r\n\v\f]/.test(char)) {
      break;
    }
    k += 1;
  }
  return { href: src.slice(start, k), next: k };
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
