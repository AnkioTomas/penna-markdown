/**
 * @file HTML 开标签属性注入
 * @module transformer/extends/utils/injectAttrs
 *
 * 将 `{class="x" data-a="1"}` 等属性字符串合并到 HTML 片段的第一个开标签上，
 * 供 html_attrs 扩展在 afterRender 阶段使用。
 */

/**
 * 将属性字符串注入到 HTML 片段的第一个开标签上。
 *
 * - 非 HTML 片段、空输入或仅有闭标签时原样返回
 * - 自闭合标签在 `/` 前插入属性
 * - 普通开标签在 `>` 前插入属性
 *
 * @param {string} html
 * @param {string} attrs - 如 `class="x" data-a="1"`
 * @returns {string}
 */
export function injectAttrsIntoFirstOpenTag(html, attrs) {
  if (!html || !attrs) return html ?? "";
  if (!html.startsWith("<") || html.startsWith("</")) return html;

  const gt = html.indexOf(">");
  if (gt === -1) return html;

  const before = html.slice(0, gt);
  const rest = html.slice(gt + 1);
  const beforeTrimmed = before.replace(/\s*$/, "");

  if (beforeTrimmed.endsWith("/")) {
    const base = beforeTrimmed.slice(0, -1).replace(/\s*$/, "");
    return `${base} ${attrs} />${rest}`;
  }

  return `${beforeTrimmed} ${attrs}>${rest}`;
}
