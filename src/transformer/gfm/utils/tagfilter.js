/**
 * @file GFM tagfilter 扩展
 * @module transformer/gfm/utils/tagfilter
 *
 * 将危险 HTML 标签的 leading `<` 替换为 `&lt;`。
 * @see https://github.github.com/gfm/#disallowed-raw-html-extension-
 */

/** 需过滤的危险 HTML 标签名正则 */
const FILTERED_TAG =
  /<\/?(?:title|textarea|style|xmp|iframe|noembed|noframes|script|plaintext)(?=[\s/>]|$)/gi;

/**
 * 对 HTML 字符串应用 GFM tagfilter。
 *
 * @param {string} html
 * @returns {string}
 */
export function applyTagFilter(html) {
  return String(html).replace(FILTERED_TAG, (tag) => `&lt;${tag.slice(1)}`);
}
