/**
 * @file Cherry Web API 远程渲染工具
 * @module transformer/extends/utils/cherryApi
 *
 * 与 cherry-markdown 一致的远程渲染方案：
 * - 数学公式：https://math-api-delta.vercel.app
 * - ECharts 图表：https://echarts-api.vercel.app
 * - Mermaid 图表：https://mermaid.ink
 *
 * 将 LaTeX / JSON / Mermaid 源码转为 `<img>` 标签，由外部 API 生成图片 URL。
 * 主题色由客户端根据 `[data-theme=dark]` 在 hydrate 阶段注入。
 */

import { escapeHtml } from "@/transformer/utils/escape.js";

/** 数学公式渲染 API 基址。 */
export const MATH_API_HOST = "https://math-api-delta.vercel.app";

/** ECharts 图表渲染 API 基址。 */
export const ECHARTS_API_HOST = "https://echarts-api.vercel.app";

/** Mermaid 图表渲染 API 基址。 */
export const MERMAID_API_HOST = "https://mermaid.ink";

/**
 * 解析 ECharts 代码块内容为配置对象。
 *
 * 优先按标准 JSON 解析；失败时尝试使用 revoked eval 模式（兼容 cherry 非严格 JSON）。
 * 注意：此函数存在安全风险，仅在可信环境下使用。
 *
 * @param {string} src - 代码块原始文本
 * @returns {Record<string, unknown>} 解析成功返回对象，否则返回空对象
 */
export function parseEchartsJson(src) {
  const trimmed = src.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      return Function(`"use strict"; return ${trimmed}`)();
    } catch {
      return {};
    }
  }
}

/**
 * 构造 Math API 图片 URL（块级 `from`，行内 `inline`）。
 *
 * @param {string} content
 * @param {Object} [options]
 * @param {string} [options.apiHost]
 * @param {boolean} [options.inline=false]
 * @param {string} [options.color]
 * @returns {string}
 */
export function buildMathImageSrc(
  content,
  { apiHost = MATH_API_HOST, inline = false, color } = {},
) {
  const latex = content.trim();
  if (!latex) return "";
  const param = inline ? "inline" : "from";
  let url = `${apiHost}/?${param}=${encodeURIComponent(latex)}`;
  if (color) url += `&color=${encodeURIComponent(color)}`;
  return url;
}

/**
 * @param {string} latex
 * @param {boolean} inline
 */
function mathImgAttrs(latex, inline) {
  const alt = escapeHtml(latex);
  const inlineAttr = inline ? ' data-inline="true"' : ' data-inline="false"';
  return `class="cherry-math-latex" data-latex="${alt}"${inlineAttr} alt="${alt}"`;
}

export function renderMathBlock(content, options = {}) {
  const latex = content.trim();
  const src = buildMathImageSrc(latex, options);
  if (!src) return "";
  return `<div class="cherry-math cherry-math-block" data-type="mathBlock"><img ${mathImgAttrs(latex, false)} src="${src}" loading="lazy" /></div>`;
}

export function renderMathInline(content, options = {}) {
  const latex = content.trim();
  const src = buildMathImageSrc(latex, { ...options, inline: true });
  if (!src) return "";
  return `<span class="cherry-math cherry-math-inline" data-type="mathInline"><img ${mathImgAttrs(latex, true)} src="${src}" loading="lazy" /></span>`;
}

/**
 * 将字符串编码为 URL 安全的 Base64（RFC 4648 base64url，无 padding）。
 *
 * @param {string} text
 * @returns {string}
 */
export function base64UrlEncode(text) {
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(text, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    }
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch {
    return "";
  }
}

/**
 * base64url 解码为 UTF-8 字符串。
 *
 * @param {string} payload
 * @returns {string}
 */
export function base64UrlDecode(payload) {
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const normalized = pad ? base64 + "=".repeat(4 - pad) : base64;
    if (typeof Buffer !== "undefined") {
      return Buffer.from(normalized, "base64").toString("utf8");
    }
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

/**
 * 构造 mermaid.ink 图片 URL。
 *
 * @param {string} code
 * @param {Object} [options]
 * @param {string} [options.apiHost]
 * @param {"dark" | undefined} [options.theme]
 * @returns {string}
 */
export function buildMermaidImageSrc(code, { apiHost = MERMAID_API_HOST, theme } = {}) {
  const trimmed = code.trim();
  if (!trimmed) return "";
  const payload = base64UrlEncode(JSON.stringify({ code: trimmed }));
  let url = `${apiHost}/img/${payload}`;
  if (theme === "dark") url += "?theme=dark";
  return url;
}

/**
 * 构造 echarts-api 图片 URL。
 *
 * @param {string} content
 * @param {Object} [options]
 * @param {string} [options.apiHost]
 * @param {"dark" | undefined} [options.theme]
 * @param {number} [options.width=600]
 * @param {number} [options.height=400]
 * @returns {string}
 */
export function buildEchartsImageSrc(
  content,
  { apiHost = ECHARTS_API_HOST, theme, width = 600, height = 400 } = {},
) {
  const data = {
    width,
    height,
    options: parseEchartsJson(content),
  };
  if (theme === "dark") data.theme = "dark";
  return `${apiHost}?data=${encodeURIComponent(JSON.stringify(data))}`;
}

/**
 * 将 Mermaid 代码块渲染为远程图片 HTML 片段。
 *
 * @param {string} content
 * @param {Object} [options]
 * @returns {string}
 */
export function renderMermaidBlock(content, options = {}) {
  const code = content.trim();
  const src = buildMermaidImageSrc(code, options);
  const payload = base64UrlEncode(code);
  return `<figure data-type="mermaid" class="cherry-mermaid-block"><img class="cherry-mermaid__img" data-mermaid="${payload}" style="max-width: 100%" src="${src}" alt="" /></figure>`;
}

/**
 * 将 ECharts 配置代码块渲染为远程图片 HTML 片段。
 *
 * @param {string} content
 * @param {Object} [options]
 * @returns {string}
 */
export function renderEchartsBlock(content, options = {}) {
  const src = buildEchartsImageSrc(content, options);
  const payload = base64UrlEncode(content.trim());
  return `<div data-type="echarts" class="cherry-echarts-block"><img class="cherry-echarts__img" data-echarts="${payload}" style="max-width: 100%" src="${src}" alt="" /></div>`;
}
