/**
 * @file 块级语法拓展：Penna 特殊代码块 + Web API 远程渲染
 * @module transformer/extends/block/specialCode
 *
 * 在 GFM 代码块基础上，对 echarts / mermaid 等语言使用专用渲染器。
 * 配置：`syntaxOptions.code`
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import codeParser from "@/transformer/gfm/block/code.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { unescapeHref } from "@/transformer/utils/linkDestination.js";
import { decodeHtmlEntities } from "@/transformer/utils/htmlEntities.js";

/** ECharts 图表渲染 API 基址。 */
export const ECHARTS_API_HOST = "https://echarts-api.vercel.app";

/** Mermaid 图表渲染 API 基址。 */
export const MERMAID_API_HOST = "https://mermaid.ink";

/** `syntaxOptions.code`（echarts / mermaid 等特殊语言） */
export interface SpecialCodeOptions extends Record<string, unknown> {
  echartsApiHost?: string;
  mermaidApiHost?: string;
  echartsWidth?: number;
  echartsHeight?: number;
}

export interface MermaidImageOptions {
  apiHost?: string;
  theme?: "dark";
}

export interface EchartsImageOptions {
  apiHost?: string;
  theme?: "dark";
  width?: number;
  height?: number;
}

const SPECIAL_LANGS = new Set(["echarts", "mermaid", "graph"]);

export function parseEchartsJson(src: string): Record<string, unknown> {
  const trimmed = src.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    try {
      return Function(`"use strict"; return ${trimmed}`)() as Record<
        string,
        unknown
      >;
    } catch {
      return {};
    }
  }
}

export function base64UrlEncode(text: string): string {
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

export function base64UrlDecode(payload: string): string {
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

function parseFenceLang(line: string): string | null {
  const match = line.match(/^( {0,3})((`{3,})([^`]*)|(~{3,})(.*))$/);
  if (!match) return null;
  const info = (match[4] || match[6] || "").trim();
  return decodeHtmlEntities(unescapeHref(info.split(/\s+/)[0])).toLowerCase();
}

class SpecialCodeBlockParser extends BaseBlockParser {
  constructor() {
    super("code");
  }

  private cfg(): SpecialCodeOptions {
    return this.getOptions() as SpecialCodeOptions;
  }

  buildMermaidImageSrc(
    code: string,
    { apiHost, theme }: MermaidImageOptions = {},
  ): string {
    const trimmed = code.trim();
    if (!trimmed) return "";
    const host = apiHost ?? this.cfg().mermaidApiHost ?? MERMAID_API_HOST;
    const payload = base64UrlEncode(
      JSON.stringify({ code: trimmed, mermaid: { theme: "default" } }),
    );
    let url = `${host}/svg/${payload}`;
    if (theme === "dark") url += "?theme=dark";
    return url;
  }

  buildEchartsImageSrc(
    content: string,
    { apiHost, theme, width, height }: EchartsImageOptions = {},
  ): string {
    const opts = this.cfg();
    const host = apiHost ?? opts.echartsApiHost ?? ECHARTS_API_HOST;
    const data: {
      width: number;
      height: number;
      options: Record<string, unknown>;
      theme?: "dark";
    } = {
      width: width ?? opts.echartsWidth ?? 600,
      height: height ?? opts.echartsHeight ?? 400,
      options: parseEchartsJson(content),
    };
    if (theme === "dark") data.theme = "dark";
    return `${host}?data=${encodeURIComponent(JSON.stringify(data))}`;
  }

  renderMermaidBlock(
    content: string,
    options: MermaidImageOptions = {},
    lineAttrs = "",
  ): string {
    const code = content.trim();
    const src = this.buildMermaidImageSrc(code, options);
    const payload = base64UrlEncode(code);
    return `<figure data-type="mermaid" class="penna-mermaid-block"${lineAttrs}><img class="penna-mermaid__img" data-mermaid="${payload}" style="max-width: 100%" src="${src}" alt="" loading="lazy" /></figure>`;
  }

  renderEchartsBlock(
    content: string,
    options: EchartsImageOptions = {},
    lineAttrs = "",
  ): string {
    const src = this.buildEchartsImageSrc(content, options);
    const payload = base64UrlEncode(content.trim());
    return `<div data-type="echarts" class="penna-echarts-block"${lineAttrs}><img class="penna-echarts__img" data-echarts="${payload}" style="max-width: 100%" src="${src}" alt="" loading="lazy" /></div>`;
  }

  /** @inheritdoc */
  canOpenAt(
    lines: string[],
    index: number,
    ctx: Parameters<BaseBlockParser["canOpenAt"]>[2],
  ) {
    return codeParser.canOpenAt(lines, index, ctx);
  }

  /** @inheritdoc */
  parse(
    lines: string[],
    index: number,
    ctx: Parameters<BaseBlockParser["parse"]>[2],
  ) {
    const result = codeParser.parse(lines, index, ctx);
    if (result) {
      const lang = parseFenceLang(lines[index] ?? "");
      if (lang && SPECIAL_LANGS.has(lang)) {
        result.node.props = { ...result.node.props, lang };
      }
    }
    return result;
  }

  /** @inheritdoc */
  render(
    node: Parameters<BaseBlockParser["render"]>[0],
    ctx: Parameters<BaseBlockParser["render"]>[1],
  ) {
    const lang = String(node.props?.lang ?? "").toLowerCase();
    const content = node.value ?? "";
    const theme = ctx.isDark ? ("dark" as const) : undefined;
    let lineAttrs = this.sourceLineAttrs(node);
    const maxWidth = node.props?.maxWidth;
    if (typeof maxWidth === "string" && maxWidth) {
      lineAttrs += ` style="max-width:${escapeHtml(maxWidth)}"`;
    }
    if (lang === "mermaid" || lang === "graph") {
      return this.renderMermaidBlock(content, { theme }, lineAttrs);
    }
    if (lang === "echarts") {
      return this.renderEchartsBlock(content, { theme }, lineAttrs);
    }
    return this.renderPlainGfmCode(node, ctx);
  }

  private renderPlainGfmCode(node: MarkdownNode, ctx: RenderContext): string {
    const lang = String(node.props?.lang ?? "");
    const content = node.value ?? "";
    const classAttr = lang
      ? ` class="language-${escapeHtml(lang.trim())}"`
      : "";
    const suffix = content === "" ? "" : "\n";
    const inner = `${escapeHtml(content)}${suffix}`;
    return `<pre${this.sourceLineAttrs(node)}><code${classAttr}>${inner}</code></pre>`;
  }
}

const specialCodeParser = new SpecialCodeBlockParser();

export default specialCodeParser;

export function buildMermaidImageSrc(
  code: string,
  options: MermaidImageOptions = {},
): string {
  return specialCodeParser.buildMermaidImageSrc(code, options);
}

export function buildEchartsImageSrc(
  content: string,
  options: EchartsImageOptions = {},
): string {
  return specialCodeParser.buildEchartsImageSrc(content, options);
}

export function renderMermaidBlock(
  content: string,
  options: MermaidImageOptions = {},
): string {
  return specialCodeParser.renderMermaidBlock(content, options);
}

export function renderEchartsBlock(
  content: string,
  options: EchartsImageOptions = {},
): string {
  return specialCodeParser.renderEchartsBlock(content, options);
}
