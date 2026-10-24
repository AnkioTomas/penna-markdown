/**
 * @file 块级语法拓展：Penna 特殊代码块 + 远程 / 本地渲染
 * @module transformer/extends/block/specialCode
 *
 * 在 GFM 代码块基础上，对 echarts / mermaid 等语言使用专用渲染器。
 * 默认输出远程 `<img src>`；Renderer `engines` 可关掉 API 并本地水合。
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

/**
 * `syntaxOptions.code`（echarts / mermaid 等特殊语言）
 * `*ApiHost: false` 禁用远程图（配合 Renderer.engines）
 */
export interface SpecialCodeOptions extends Record<string, unknown> {
  echartsApiHost?: string | false;
  mermaidApiHost?: string | false;
  echartsWidth?: number;
  echartsHeight?: number;
}

export interface MermaidImageOptions {
  apiHost?: string | false;
  theme?: "dark";
}

export interface EchartsImageOptions {
  apiHost?: string | false;
  theme?: "dark";
  width?: number;
  height?: number;
}

const SPECIAL_LANGS = new Set(["echarts", "mermaid", "graph"]);

/**
 * 把 JS 对象字面量风格（无引号 key、单引号字符串、尾逗号、注释）转成严格 JSON。
 * 只接受数据：函数、变量、表达式一律抛错，不执行任何代码。
 */
function relaxedToJson(src: string): string {
  let out = "";
  let i = 0;
  const n = src.length;
  const nextSignificant = (from: number): string => {
    let j = from;
    while (j < n) {
      if (/\s/.test(src[j]!)) j++;
      else if (src[j] === "/" && src[j + 1] === "/") {
        while (j < n && src[j] !== "\n") j++;
      } else if (src[j] === "/" && src[j + 1] === "*") {
        const end = src.indexOf("*/", j + 2);
        j = end < 0 ? n : end + 2;
      } else break;
    }
    return src[j] ?? "";
  };

  while (i < n) {
    const c = src[i]!;
    if (/\s/.test(c)) {
      out += c;
      i++;
    } else if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
    } else if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end < 0 ? n : end + 2;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      let text = "";
      while (j < n && src[j] !== c) {
        if (src[j] === "\\" && j + 1 < n) {
          const e = src[j + 1]!;
          text += e === "'" ? "'" : `\\${e}`;
          j += 2;
        } else text += src[j++];
      }
      if (j >= n) throw new Error("unterminated string");
      // 双引号串原样保留；单引号串需转义内部的双引号
      out += c === '"' ? `"${text}"` : `"${text.replace(/"/g, '\\"')}"`;
      i = j + 1;
    } else if (c === ",") {
      const next = nextSignificant(i + 1);
      if (next !== "}" && next !== "]") out += c;
      i++;
    } else if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[\w$]/.test(src[j]!)) j++;
      const word = src.slice(i, j);
      if (nextSignificant(j) === ":") out += JSON.stringify(word);
      else if (word === "true" || word === "false" || word === "null")
        out += word;
      else throw new Error(`unsupported token: ${word}`);
      i = j;
    } else if (/[0-9.+\-]/.test(c)) {
      const m = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i));
      if (!m) throw new Error("bad number");
      out += m[0].replace(/^\+/, "");
      i += m[0].length;
    } else if ("{}[]:".includes(c)) {
      out += c;
      i++;
    } else {
      throw new Error(`unsupported char: ${c}`);
    }
  }
  return out;
}

/** 解析 ECharts option：严格 JSON，或宽松的对象字面量（不执行代码）。失败返回 `{}`。 */
export function parseEchartsJson(src: string): Record<string, unknown> {
  const trimmed = src.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(relaxedToJson(trimmed)) as Record<string, unknown>;
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
    if (host === false || host === "") return "";
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
    if (host === false || host === "") return "";
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
    const srcAttr = src ? ` src="${src}"` : "";
    return `<figure data-type="mermaid" class="penna-mermaid-block"${lineAttrs}><img class="penna-mermaid__img" data-mermaid="${payload}" style="max-width: 100%"${srcAttr} alt="" loading="lazy" /></figure>`;
  }

  renderEchartsBlock(
    content: string,
    options: EchartsImageOptions = {},
    lineAttrs = "",
  ): string {
    const src = this.buildEchartsImageSrc(content, options);
    const payload = base64UrlEncode(content.trim());
    const srcAttr = src ? ` src="${src}"` : "";
    return `<div data-type="echarts" class="penna-echarts-block"${lineAttrs}><img class="penna-echarts__img" data-echarts="${payload}" style="max-width: 100%"${srcAttr} alt="" loading="lazy" /></div>`;
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
