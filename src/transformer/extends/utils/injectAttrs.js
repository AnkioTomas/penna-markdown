/**
 * 将属性字符串注入到 HTML 片段的第一个开标签上。
 *
 * @param {string} html
 * @param {string} attrs 如 `class="x" data-a="1"`
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
