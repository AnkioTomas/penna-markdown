/**
 * @file 原始 HTML 片段渲染期净化
 * @module transformer/utils/safeHtml
 *
 * 在 html_inline / html_block 的 render 阶段调用，不依赖 DOMPurify。
 */

import { isSafeUrl } from "@/transformer/utils/safeUrl.js";

const FORBIDDEN_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "base",
  "link",
  "meta",
  "form",
  "input",
  "button",
  "textarea",
]);

const EVENT_ATTR_RE =
  /\s+on[a-z0-9-]+\s*(?:=\s*(?:"[^"]*"|'[^']*'|[^\s/>]+))?/gi;

const URL_ATTR_RE =
  /\s+(href|src|poster|xlink:href)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;

function stripBlockedRegions(html: string): string {
  return html
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
}

function sanitizeTag(match: string, body: string): string {
  const trimmed = body.trim();
  if (trimmed.startsWith("!--")) return match;
  if (trimmed.startsWith("?")) return match;
  if (!trimmed || trimmed.startsWith("!")) return "";

  const isClose = trimmed.startsWith("/");
  const nameMatch = (isClose ? trimmed.slice(1) : trimmed).match(
    /^([a-z][\w-]*)/i,
  );
  const tagName = nameMatch?.[1] ?? "";
  const tagNameLower = tagName.toLowerCase();
  if (tagNameLower && FORBIDDEN_TAGS.has(tagNameLower)) return "";

  if (isClose) {
    return tagName ? `</${tagName}>` : "";
  }

  let tagBody = body.replace(EVENT_ATTR_RE, "");
  tagBody = tagBody.replace(
    URL_ATTR_RE,
    (segment, _attr, _quote, dq, sq, uq) => {
      const raw = dq ?? sq ?? uq ?? "";
      return isSafeUrl(raw) ? segment : "";
    },
  );

  return `<${tagBody}>`;
}

/**
 * 净化单行或块级原始 HTML（去事件属性、危险协议、禁止标签）。
 */
export function sanitizeRawHtml(html: string): string {
  if (!html) return "";
  const stripped = stripBlockedRegions(html);
  return stripped.replace(/<([^>]+)>/g, sanitizeTag);
}
