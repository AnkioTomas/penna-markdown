/**
 * @file HTML 转义工具
 * @module transformer/utils/escape
 *
 * 渲染阶段将文本与属性值转义，防止 XSS。
 */

/**
 * 转义 HTML 特殊字符（&、<、>、"）。
 *
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * CommonMark 行内文本转义（与 GFM 期望一致）。
 *
 * @param {string} text
 * @returns {string}
 */
export function escapeText(text) {
  return escapeHtml(text);
}

/**
 * 无效尖括号内容转义：转义所有 HTML 特殊字符。
 *
 * @param {string} text
 * @returns {string}
 */
export function escapeAngleBrackets(text) {
  return escapeHtml(text);
}
