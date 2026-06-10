/**
 * @file HTML 开标签属性注入
 * @module transformer/extends/utils/injectAttrs
 *
 * 将 `{class="x" data-a="1"}` 等属性字符串合并到 HTML 片段的第一个开标签上，
 * 供 html_attrs 扩展在 afterRender 阶段使用。
 */

/**
 * @param {string} str
 * @returns {string | null}
 */
function parseClassValue(str) {
  const m = str.match(/\bclass="([^"]*)"/);
  return m ? m[1] : null;
}

/**
 * @param {string} str
 * @returns {string}
 */
function stripClassAttr(str) {
  return str.replace(/\bclass="[^"]*"\s*/, "").trim();
}

/**
 * 将属性字符串注入到 HTML 片段的第一个开标签上。
 *
 * - 非 HTML 片段、空输入或仅有闭标签时原样返回
 * - 自闭合标签在 `/` 前插入属性
 * - 普通开标签在 `>` 前插入属性
 * - 若双方均有 class，合并为单一 class 属性
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

  const appendAttrs = (tag, extraAttrs) => {
    if (!extraAttrs) return `${tag}>${rest}`;
    if (tag.endsWith("/")) {
      const base = tag.slice(0, -1).replace(/\s*$/, "");
      return `${base} ${extraAttrs} />${rest}`;
    }
    return `${tag} ${extraAttrs}>${rest}`;
  };

  const existingClass = parseClassValue(beforeTrimmed);
  const injectedClass = parseClassValue(attrs);
  const otherAttrs = stripClassAttr(attrs);

  if (existingClass !== null && injectedClass !== null) {
    const mergedClass = `${existingClass} ${injectedClass}`.trim();
    const tagWithClass = beforeTrimmed.replace(
      /\bclass="[^"]*"/,
      `class="${mergedClass}"`,
    );
    return appendAttrs(tagWithClass, otherAttrs);
  }

  return appendAttrs(beforeTrimmed, attrs);
}
