/**
 * @file 链接 destination / title 解析
 * @module transformer/utils/linkDestination
 *
 * CommonMark / GFM 行内链接与引用定义的 href、title 解析与规范化。
 */

import { decodeHtmlEntities } from "@/transformer/utils/htmlEntities.js";
import { skipInlineWhitespace, type SkipInlineWhitespaceOptions } from "@/transformer/utils/normalize.js";

/** 行内链接 destination / title 之间的空白（可含单个换行）。 */
export const INLINE_LINK_WS: SkipInlineWhitespaceOptions = {
  allowNewline: true,
  maxNewlines: 1,
};

/** 行内链接闭合 `)` 前的空白（可含多个换行）。 */
const INLINE_LINK_WS_BEFORE_CLOSE: SkipInlineWhitespaceOptions = {
  allowNewline: true,
  maxNewlines: Number.MAX_SAFE_INTEGER,
};

/** GFM destination / title 中可反斜杠转义的 ASCII 标点 */
export function isAsciiPunct(ch: string): boolean {
  return /[!-/:-@\[-`{-~]/.test(ch);
}

/**
 * 解析 link destination 后去掉反斜杠转义。
 */
export function unescapeHref(href: string): string {
  let out = "";
  for (let i = 0; i < href.length; i += 1) {
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
 * 保留已有 %XX 序列，对其余字符做 URI 编码。
 */
export function normalizeLinkDestination(href: string): string {
  const decoded = decodeHtmlEntities(unescapeHref(href));
  let out = "";
  for (let i = 0; i < decoded.length; i += 1) {
    if (
      decoded[i] === "%"
      && i + 2 < decoded.length
      && /^[0-9A-Fa-f]{2}$/.test(decoded.slice(i + 1, i + 3))
    ) {
      out += decoded.slice(i, i + 3);
      i += 2;
      continue;
    }
    const cp = decoded.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    if (/^[A-Za-z0-9\-._~:/?#@!$&'()*+,;=]$/.test(ch)) {
      out += ch;
    } else {
      out += encodeURIComponent(ch);
    }
    if (cp > 0xffff) i += 1;
  }
  return out;
}

/**
 * 规范化 link title（解码实体并去掉转义）。
 */
export function normalizeLinkTitle(title: string): string {
  return decodeHtmlEntities(unescapeHref(title));
}

/**
 * 解析 `<...>` destination；闭合 `>` 必须未转义。
 */
export function findUnescapedAngleClose(src: string, openIndex: number): number {
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

/**
 * 解析尖括号包裹的 link destination。
 */
export function parseAngleDestination(
  src: string,
  start: number,
): { href: string; next: number } | null {
  if (src[start] !== "<") return null;
  const close = findUnescapedAngleClose(src, start);
  if (close === -1) return null;
  return { href: src.slice(start + 1, close), next: close + 1 };
}

/**
 * 解析非尖括号 destination；转义括号不参与平衡计数。
 */
export function parsePlainDestination(
  src: string,
  start: number,
): { href: string; next: number } {
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
    } else if (char === " " || char === "\t" || char === "\n" || char === "\r" || char === "\v" || char === "\f") {
      break;
    }
    k += 1;
  }
  return { href: src.slice(start, k), next: k };
}

export interface ParsedLinkTitle {
  title: string;
  next: number;
  closed: boolean;
}

/**
 * 从 opener 字符起解析 link title（`"`、`'` 或 `(`）。
 */
export function parseLinkTitle(src: string, start: number): ParsedLinkTitle | null {
  if (start >= src.length) return null;
  const opener = src[start];
  if (opener !== '"' && opener !== "'" && opener !== "(") return null;

  const closer = opener === "(" ? ")" : opener;
  const titleStart = start + 1;
  let j = titleStart;
  let closed = false;

  while (j < src.length) {
    if (src[j] === "\\" && j + 1 < src.length) {
      j += 2;
      continue;
    }
    if (src[j] === closer) {
      closed = true;
      return {
        title: src.slice(titleStart, j),
        next: j + 1,
        closed: true,
      };
    }
    j += 1;
  }

  return { title: "", next: start, closed };
}

export interface ParsedInlineLink {
  href: string;
  title: string;
  next: number;
}

/** angle destination 内因换行导致解析失败。 */
export function isAngleDestinationBrokenByNewline(src: string, openIndex: number): boolean {
  if (src[openIndex] !== "<") return false;
  let k = openIndex + 1;
  while (k < src.length) {
    if (src[k] === "\n") return true;
    if (src[k] === "\\") {
      if (k + 1 < src.length && isAsciiPunct(src[k + 1])) {
        k += 2;
        continue;
      }
      k += 1;
      continue;
    }
    if (src[k] === ">") return false;
    if (src[k] === "<") return false;
    k += 1;
  }
  return false;
}

function findAngleCloseRelaxed(src: string, openIndex: number): number {
  for (let k = openIndex + 1; k < src.length; k += 1) {
    if (src[k] === ">") return k;
  }
  return -1;
}

/**
 * 行内链接 `( <...含换行...> )` 解析失败时，扫描整段字面量的闭合位置。
 *
 * @param src 源文本
 * @param parenStart `(` 的位置
 */
export function scanFailedAngleInlineLinkEnd(src: string, parenStart: number): number {
  if (src[parenStart] !== "(") return -1;

  let j = skipInlineWhitespace(src, parenStart + 1, INLINE_LINK_WS);
  if (j >= src.length || src[j] !== "<") return -1;
  if (!isAngleDestinationBrokenByNewline(src, j)) return -1;

  const close = findAngleCloseRelaxed(src, j);
  if (close === -1) return -1;
  j = close + 1;

  j = skipInlineWhitespace(src, j, INLINE_LINK_WS);

  const titleParsed = parseLinkTitle(src, j);
  if (titleParsed?.closed) {
    j = titleParsed.next;
  } else if (titleParsed && !titleParsed.closed) {
    return -1;
  }

  j = skipInlineWhitespace(src, j, INLINE_LINK_WS_BEFORE_CLOSE);
  if (j >= src.length || src[j] !== ")") return -1;
  return j + 1;
}

/**
 * 解析 `(href "title")` 形式的行内链接 destination 与可选 title。
 *
 * @param src 源文本
 * @param start `(` 的位置
 */
export function parseInlineLinkParen(
  src: string,
  start: number,
): ParsedInlineLink | null {
  if (src[start] !== "(") return null;

  let j = skipInlineWhitespace(src, start + 1, INLINE_LINK_WS);
  if (j >= src.length) return null;

  let href = "";
  if (src[j] === "<") {
    const dest = parseAngleDestination(src, j);
    if (!dest) return null;
    href = dest.href;
    j = dest.next;
  } else {
    const dest = parsePlainDestination(src, j);
    href = dest.href;
    j = dest.next;
  }

  j = skipInlineWhitespace(src, j, INLINE_LINK_WS);

  let title = "";
  const titleParsed = parseLinkTitle(src, j);
  if (titleParsed?.closed) {
    title = titleParsed.title;
    j = titleParsed.next;
  } else if (titleParsed && !titleParsed.closed) {
    return null;
  }

  j = skipInlineWhitespace(src, j, INLINE_LINK_WS_BEFORE_CLOSE);
  if (j >= src.length || src[j] !== ")") return null;

  return {
    href: normalizeLinkDestination(href),
    title: title ? normalizeLinkTitle(title) : "",
    next: j + 1,
  };
}
