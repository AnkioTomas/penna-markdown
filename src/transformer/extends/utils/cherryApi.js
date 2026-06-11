/**
 * @file Cherry Web API 远程渲染工具
 * @module transformer/extends/utils/cherryApi
 *
 * 与 cherry-markdown 一致的远程渲染方案：
 * - 数学公式：https://math.vercel.app
 * - ECharts 图表：https://echarts-api.vercel.app
 * - Mermaid 图表：https://mermaid.ink
 *
 * 将 LaTeX / JSON / Mermaid 源码转为 `<img>` 标签，由外部 API 生成图片 URL。
 */

import { escapeHtml } from "@/transformer/utils/escape.js";

/** 数学公式渲染 API 基址。 */
export const MATH_API_HOST = "https://math.vercel.app";

/** ECharts 图表渲染 API 基址。 */
export const ECHARTS_API_HOST = "https://echarts-api.vercel.app";

/** Mermaid 图表渲染 API 基址。 */
export const MERMAID_API_HOST = "https://mermaid.ink";

/**
 * 检测当前环境是否偏好深色配色方案。
 *
 * @returns {boolean}
 */
export function prefersDarkScheme() {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

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
    // 尝试解析 JavaScript 对象字面量（非严格 JSON）
    // 使用 Function 构造器而非直接 eval 以保持严格模式
    try {
      return Function(`"use strict"; return ${trimmed}`)();
    } catch {
      return {};
    }
  }
}

/**
 * 构造 math.vercel.app 图片 URL。
 *
 * @param {string} content
 * @param {Object} [options]
 * @param {string} [options.apiHost]
 * @returns {string}
 */
export function buildMathImageSrc(content, { apiHost = MATH_API_HOST } = {}) {
  const latex = content.trim();
  if (!latex) return "";
  const color = prefersDarkScheme() ? "white" : "black";
  return `${apiHost}/?from=${encodeURIComponent(latex)}&color=${color}`;
}

/**
 * 将 LaTeX 数学块渲染为 HTML 片段。
 *
 * @param {string} content
 * @param {Object} [options]
 * @returns {string}
 */
export function renderMathBlock(content, options = {}) {
  const latex = content.trim();
  const src = buildMathImageSrc(latex, options);
  if (!src) return "";
  return `<div class="cherry-math cherry-math-block" data-type="mathBlock"><img class="cherry-math-latex" alt="${escapeHtml(latex)}" src="${src}" loading="lazy" /></div>`;
}

/**
 * 将行内 LaTeX 数学公式渲染为 HTML 片段。
 *
 * @param {string} content
 * @param {Object} [options]
 * @returns {string}
 */
export function renderMathInline(content, options = {}) {
  const latex = content.trim();
  const src = buildMathImageSrc(latex, options);
  if (!src) return "";
  return `<span class="cherry-math cherry-math-inline" data-type="mathInline"><img class="cherry-math-latex" alt="${escapeHtml(latex)}" src="${src}" loading="lazy" /></span>`;
}

/**
 * 将字符串编码为 URL 安全的 Base64（RFC 4648 base64url，无 padding）。
 *
 * Node 环境使用 Buffer，浏览器环境使用 TextEncoder + btoa。
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
    // 出错时返回空字符串，避免中断后续处理
    return "";
  }
}

/**
 * 将 Mermaid 代码块渲染为远程图片 HTML 片段。
 *
 * @param {string} content - Mermaid 源码
 * @param {Object} [options={}]
 * @param {string} [options.apiHost=MERMAID_API_HOST] - Mermaid API 基址
 * @returns {string}
 */
export function renderMermaidBlock(content, { apiHost = MERMAID_API_HOST } = {}) {
  const code = content.trim();
  const payload = base64UrlEncode(JSON.stringify({ code }));
  const src = `${apiHost}/img/${payload}`;
  return `<figure data-type="mermaid" class="cherry-mermaid-block"><img class="mermaid-container" style="max-width: 100%" src="${src}" alt="" /></figure>`;
}

/**
 * 将 ECharts 配置代码块渲染为远程图片 HTML 片段。
 *
 * 根据系统配色选择主题，并将宽高与 options 一并传给 echarts-api。
 *
 * @param {string} content - ECharts 配置 JSON / 对象字面量
 * @param {Object} [options={}]
 * @param {string} [options.apiHost=ECHARTS_API_HOST] - ECharts API 基址
 * @returns {string}
 */
export function renderEchartsBlock(content, { apiHost = ECHARTS_API_HOST } = {}) {
  const isDark = prefersDarkScheme();
  const data = {
    theme: isDark ? "dark" : "",
    width: 600,
    height: 400,
    options: parseEchartsJson(content),
  };
  const src = `${apiHost}?data=${encodeURIComponent(JSON.stringify(data))}`;
  return `<div data-type="echarts" class="cherry-echarts-block"><img class="echart-container" style="max-width: 100%" src="${src}" alt="" /></div>`;
}
