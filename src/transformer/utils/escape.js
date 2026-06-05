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

/** CommonMark 行内文本：全面转义以匹配 GFM 期望 */
export function escapeText(text) {
  return escapeHtml(text);
}

/** 无效尖括号内容：转义所有 HTML 特殊字符 */
export function escapeAngleBrackets(text) {
  return escapeHtml(text);
}
