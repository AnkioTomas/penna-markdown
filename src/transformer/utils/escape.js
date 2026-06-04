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
