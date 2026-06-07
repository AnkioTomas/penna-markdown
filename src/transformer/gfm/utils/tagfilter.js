/**
 * GFM tagfilter：将危险 HTML 标签的 leading `<` 替换为 `&lt;`
 * @see https://github.github.com/gfm/#disallowed-raw-html-extension-
 */

const FILTERED_TAG =
  /<\/?(?:title|textarea|style|xmp|iframe|noembed|noframes|script|plaintext)(?=[\s/>]|$)/gi;

export function applyTagFilter(html) {
  return String(html).replace(FILTERED_TAG, (tag) => `&lt;${tag.slice(1)}`);
}
