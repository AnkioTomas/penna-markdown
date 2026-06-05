/**
 * HTML 转义工具，用于渲染阶段防止 XSS。
 */

/** 转义文本中的 HTML 特殊字符 */
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** CommonMark 行内文本：转义 & 与 "，保留 < > */
export function escapeText(text) {
  return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** 无效尖括号 autolink 字面量：转义 & < > */
export function escapeAngleBrackets(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
