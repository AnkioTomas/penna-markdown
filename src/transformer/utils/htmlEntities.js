/**
 * @file HTML 实体解析
 * @module transformer/utils/htmlEntities
 *
 * GFM / HTML5 命名实体与数字字符引用解析。
 */

import { decodeHTMLStrict } from "entities";

/** GFM 实体前缀正则 @see https://github.github.io/gfm/#entity-and-numeric-character-references */
const ENTITY_PREFIX_RE =
  /^&(?:#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[A-Za-z][A-Za-z0-9]{0,31});/;

/**
 * 从 src[index] 起尝试匹配并解码 HTML 实体。
 *
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

/**
 * 将字符串中所有合法实体解码为 Unicode 字符。
 *
 * @param {string} text
 * @returns {string}
 */
export function decodeHtmlEntities(text) {
  return text.replace(ENTITY_PREFIX_RE, (match) => {
    try {
      return decodeHTMLStrict(match);
    } catch {
      return match;
    }
  });
}
