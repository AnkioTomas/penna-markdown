/**
 * GFM / HTML5 实体与数字字符引用解析
 */

import { decodeHTMLStrict } from "entities";

/** @see https://github.github.io/gfm/#entity-and-numeric-character-references */
const ENTITY_PREFIX_RE =
  /^&(?:#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[A-Za-z][A-Za-z0-9]{0,31});/;

/**
 * @param {string} src
 * @param {number} index
 * @returns {{ value: string, length: number } | null}
 */
export function tryParseEntity(src, index) {
  if (src[index] !== "&") return null;

  const match = src.slice(index).match(ENTITY_PREFIX_RE);
  if (!match) return null;

  const raw = match[0];
  const decoded = decodeHTMLStrict(raw);

  if (/^&[A-Za-z]/.test(raw) && decoded === raw) {
    return null;
  }

  return { value: decoded, length: raw.length };
}

/** 将字符串中合法实体解码为 Unicode 字符 */
export function decodeHtmlEntities(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const parsed = tryParseEntity(text, i);
    if (parsed) {
      out += parsed.value;
      i += parsed.length;
      continue;
    }
    out += text[i];
    i += 1;
  }
  return out;
}
