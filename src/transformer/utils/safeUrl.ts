/**
 * @file URL 安全校验（链接 / 媒体 src / poster）
 * @module transformer/utils/safeUrl
 */

import { escapeHtml, htmlAttr } from "@/transformer/utils/escape.js";

const BLOCKED_SCHEMES = new Set([
  "javascript",
  "data",
  "vbscript",
  "file",
]);

/**
 * 判断 URL 是否可安全用于 href / src / poster。
 * - 允许：相对路径、#fragment、空 href、GFM 自定义 scheme（如 localhost:、made-up-scheme:）
 * - 拒绝：javascript:、data:、vbscript:、file: 等已知危险 scheme
 */
export function isSafeUrl(url: string): boolean {
  const raw = String(url ?? "").trim();
  // GFM 允许空 destination，如 [foo]: <> → href=""
  if (!raw) return true;

  if (raw.startsWith("#")) return true;
  if (raw.startsWith("/") && !raw.startsWith("//")) return true;
  if (raw.startsWith("./") || raw.startsWith("../")) return true;

  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
  if (!schemeMatch) return true;

  return !BLOCKED_SCHEMES.has(schemeMatch[1].toLowerCase());
}

/** iframe / 远程媒体仅允许 http(s)。 */
export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(String(url ?? "").trim());
}

/** 渲染安全 `<a>`；不安全 href 时仅输出 inner。 */
export function renderSafeAnchor(href: string, inner: string, title = ""): string {
  if (!isSafeUrl(href)) return inner;
  return `<a href="${escapeHtml(href)}"${htmlAttr("title", title)}>${inner}</a>`;
}

/** 渲染安全 `<img>`；不安全 src 时输出 alt 文本。 */
export function renderSafeImage(src: string, alt: string, title = ""): string {
  if (!isSafeUrl(src)) return escapeHtml(alt);
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${htmlAttr("title", title)} />`;
}
