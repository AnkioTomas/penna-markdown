/**
 * @file 块级语法拓展：增强围栏代码块
 * @module transformer/extends/block/enhancedCode
 *
 * 解析 info string、行高亮、折叠与顶栏渲染。
 * 代码体保持完整 `<code>` 文本；行号用旁路 gutter，行高亮用 CSS 渐变。
 * 语法高亮由 renderer hydrate 后处理。
 */

import {
  BaseBlockParser,
  ParserOptions,
} from "@/transformer/core/ParserBase.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import codeParser from "@/transformer/gfm/block/code.js";
import specialCodeParser from "@/transformer/extends/block/specialCode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { unescapeHref } from "@/transformer/utils/linkDestination.js";
import { decodeHtmlEntities } from "@/transformer/utils/htmlEntities.js";

/** `syntaxOptions.code`（增强围栏代码块） */
export interface CodeOptions extends ParserOptions {
  /** 走增强渲染（顶栏 / 复制 / 行号 / 行高亮 / 折叠 / 图表），关闭时输出朴素 GFM 代码块，默认 false */
  enhanced?: boolean;
  /** @deprecated 语义是「是否增强渲染」而不是「是否启用解析」，改用 {@link CodeOptions.enhanced} */
  enable?: boolean;
  highlightJs?: (code: string, lang: string) => string;
  /** 超长行自动换行，默认 false（横向滚动） */
  wrap?: boolean;
  /** 显示行号栏，默认 true */
  lineNumbers?: boolean;
}

const SPECIAL_LANGS = new Set(["echarts", "mermaid", "graph"]);

/** 无 `...` 标记时的默认可见行数 */
export const DEFAULT_COLLAPSED_VISIBLE_LINES = 10;

export interface CollapsedCodeAnalysis {
  enabled: boolean;
  hasMore: boolean;
  visibleCount: number;
  markerLine: number | null;
  maxLines: number;
}

// --- 行高亮 spec ---

export function parseLineHighlightSpec(spec: string): number[] {
  const lines = new Set<number>();
  for (const part of spec
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)) {
    if (part.includes("-")) {
      const [rawStart, rawEnd] = part.split("-", 2);
      const start = Number.parseInt(rawStart ?? "", 10);
      const end = Number.parseInt(rawEnd ?? "", 10);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      const from = Math.min(start, end);
      const to = Math.max(start, end);
      for (let i = from; i <= to; i += 1) lines.add(i);
    } else {
      const n = Number.parseInt(part, 10);
      if (!Number.isNaN(n)) lines.add(n);
    }
  }
  return [...lines].sort((a, b) => a - b);
}

export function mergeLineHighlightSpecs(
  ...specs: Array<number[] | string>
): number[] {
  const lines = new Set<number>();
  for (const spec of specs) {
    if (Array.isArray(spec)) {
      for (const n of spec) lines.add(n);
    } else if (typeof spec === "string" && spec.trim()) {
      for (const n of parseLineHighlightSpec(spec)) lines.add(n);
    }
  }
  return [...lines].sort((a, b) => a - b);
}

export function parseHighlightLinesAttr(raw: string | undefined): number[] {
  if (!raw?.trim()) return [];
  return mergeLineHighlightSpecs(raw);
}

export function formatHighlightLinesAttr(lines: number[]): string {
  return lines.join(",");
}

// --- 折叠分析 ---

export function isCollapseMarkerLine(line: string): boolean {
  return /^\s*\.\.\.(?:\s|$)/.test(line);
}

export function analyzeCollapsedCode(
  content: string,
  options: { enabled?: boolean; maxLines?: number } = {},
): CollapsedCodeAnalysis {
  const lines = content.split("\n");
  const maxLines = options.maxLines ?? DEFAULT_COLLAPSED_VISIBLE_LINES;

  if (!options.enabled) {
    return {
      enabled: false,
      hasMore: false,
      visibleCount: lines.length,
      markerLine: null,
      maxLines,
    };
  }

  const markerIndex = lines.findIndex((line) => isCollapseMarkerLine(line));
  if (markerIndex >= 0) {
    const hiddenCount = lines.length - markerIndex - 1;
    return {
      enabled: true,
      hasMore: hiddenCount > 0,
      visibleCount: markerIndex,
      markerLine: markerIndex + 1,
      maxLines,
    };
  }

  const hasMore = lines.length > maxLines;
  return {
    enabled: true,
    hasMore,
    visibleCount: hasMore ? maxLines : lines.length,
    markerLine: null,
    maxLines,
  };
}

/** 折叠标记行替换为空行，保持行号与行高亮对齐 */
export function normalizeCodeLines(content: string): string[] {
  return content
    .split("\n")
    .map((line) => (isCollapseMarkerLine(line) ? "" : line));
}

const HTML_TOKEN_RE = /<\/?[a-zA-Z][^>]*>|\n|[^<\n]+|</g;
const OPEN_TAG_NAME_RE = /^<([a-zA-Z][\w-]*)/;
const CLOSE_TAG_NAME_RE = /^<\/([a-zA-Z][\w-]*)/;

/**
 * 把高亮后的 HTML 按换行切成逐行片段。
 *
 * 高亮库的 `<span>` 会跨行（块注释、多行字符串），所以行尾要闭合全部未关标签、
 * 行首再原样重开，保证每行片段单独成立。
 *
 * @param html 高亮函数产出的行内 HTML。
 * @returns 与源码行一一对应的 HTML 片段。
 */
export function splitHighlightedHtml(html: string): string[] {
  const lines: string[] = [];
  const open: Array<{ name: string; tag: string }> = [];
  let buf = "";

  for (const [token] of html.matchAll(HTML_TOKEN_RE)) {
    if (token === "\n") {
      for (let i = open.length - 1; i >= 0; i -= 1)
        buf += `</${open[i]!.name}>`;
      lines.push(buf);
      buf = open.map((entry) => entry.tag).join("");
      continue;
    }

    const closeName = CLOSE_TAG_NAME_RE.exec(token)?.[1];
    if (closeName) {
      open.pop();
    } else {
      const openName = OPEN_TAG_NAME_RE.exec(token)?.[1];
      if (openName) open.push({ name: openName, tag: token });
    }
    buf += token;
  }

  lines.push(buf);
  return lines;
}

/** 渲染普通 GFM 代码块内部 HTML：有高亮函数时内联高亮，否则转义纯文本。 */
export function renderCodeInnerHtml(
  content: string,
  lang: string,
  highlightJs?: (code: string, lang: string) => string,
): string {
  if (highlightJs && content) {
    return highlightJs(content, lang);
  }
  const suffix = content === "" ? "" : "\n";
  return `${escapeHtml(content)}${suffix}`;
}

/**
 * 渲染代码块正文：每行一个 `span`，行号交给 CSS counter，行高亮和折叠是行的状态。
 *
 * 行不再依赖「第 i 行位于固定 y 偏移」这个假设，所以开启自动换行后仍然对齐。
 */
export function renderCodeBlockBodyHtml(
  content: string,
  langClass: string,
  highlightLines: number[] = [],
  collapse: CollapsedCodeAnalysis | null = null,
  highlighter?: (code: string, lang: string) => string,
): { html: string; collapse: CollapsedCodeAnalysis } {
  const analysis = collapse ?? analyzeCollapsedCode(content, {});
  const lines = highlighter
    ? splitHighlightedHtml(highlighter(content, langClass))
    : normalizeCodeLines(content).map((line) => escapeHtml(line));
  const codeClass = highlighter
    ? `language-${langClass} hljs penna-code-block__highlighted`
    : `language-${langClass}`;
  const highlightedAttr = highlighter ? ' data-penna-highlighted="1"' : "";

  const highlighted = new Set(highlightLines);
  const foldFrom =
    collapse?.enabled && analysis.hasMore
      ? analysis.visibleCount
      : lines.length;
  const codeText = lines
    .map((lineHtml, index) => {
      let cls = "penna-code-block__line";
      if (highlighted.has(index + 1))
        cls += " penna-code-block__line--highlight";
      if (index >= foldFrom) cls += " penna-code-block__line--folded";
      return `<span class="${cls}">${lineHtml}</span>`;
    })
    .join("");

  const html =
    `<div class="penna-code-block__body">` +
    `<pre class="penna-code-block__pre"><code class="${codeClass}"${highlightedAttr} data-penna-code>${codeText}</code></pre>` +
    `</div>`;

  return { html, collapse: analysis };
}

// --- 围栏 meta ---

function stripLangSuffixModifiers(lang: string): string {
  return lang.replace(/:collapsed-lines(?:=\d+)?/gi, "").trim();
}

function splitLangAndLineSpec(token: string): {
  lang: string;
  lineSpec: string;
} {
  const decoded = decodeHtmlEntities(unescapeHref(token));
  const withoutCollapse = stripLangSuffixModifiers(decoded);
  const match = withoutCollapse.match(/^([^{]*?)\{([^}]+)\}$/);
  if (match) {
    return { lang: match[1] ?? "", lineSpec: match[2] ?? "" };
  }
  return { lang: withoutCollapse, lineSpec: "" };
}

function parseCollapsedLinesMeta(info: string): {
  collapsedLines: boolean;
  collapsedMaxLines?: number;
} {
  const attached = info.match(/:collapsed-lines(?:=(\d+))?/i);
  if (attached) {
    return {
      collapsedLines: true,
      collapsedMaxLines: attached[1]
        ? Number.parseInt(attached[1], 10)
        : undefined,
    };
  }

  for (const token of info.split(/\s+/)) {
    const tokenMatch = token.match(/^:collapsed-lines(?:=(\d+))?$/i);
    if (tokenMatch) {
      return {
        collapsedLines: true,
        collapsedMaxLines: tokenMatch[1]
          ? Number.parseInt(tokenMatch[1], 10)
          : undefined,
      };
    }
  }

  return { collapsedLines: false };
}

function stripFenceMetaTokens(info: string): string {
  return info.replace(/\btitle=(?:"[^"]*"|'[^']*'|[^\s]+)/gi, "");
}

export function parseFenceMeta(line: string): {
  lang: string;
  title: string;
  highlightLines: number[];
  collapsedLines: boolean;
  collapsedMaxLines?: number;
} | null {
  const match = line.match(/^( {0,3})((`{3,})([^`]*)|(~{3,})(.*))$/);
  if (!match) return null;

  const info = (match[4] || match[6] || "").trim();
  const firstToken = info.split(/\s+/)[0] ?? "";
  const { lang: langFromToken, lineSpec: tokenLineSpec } =
    splitLangAndLineSpec(firstToken);

  let highlightLines = tokenLineSpec
    ? parseLineHighlightSpec(tokenLineSpec)
    : [];

  let restInfo = info;
  if (firstToken) {
    const tokenIndex = info.indexOf(firstToken);
    if (tokenIndex >= 0) {
      restInfo = info.slice(tokenIndex + firstToken.length).trim();
    }
  }
  const infoWithoutMeta = stripFenceMetaTokens(restInfo);
  for (const braceMatch of infoWithoutMeta.matchAll(/\{([0-9,\-\s]+)\}/g)) {
    highlightLines = mergeLineHighlightSpecs(
      highlightLines,
      parseLineHighlightSpec(braceMatch[1] ?? ""),
    );
  }

  let title = "";
  const titleMatch = info.match(/\btitle=(?:"([^"]*)"|'([^']*)'|([^\s]+))/i);
  if (titleMatch) {
    title = decodeHtmlEntities(
      unescapeHref(titleMatch[1] ?? titleMatch[2] ?? titleMatch[3] ?? ""),
    );
  }

  const collapsed = parseCollapsedLinesMeta(info);

  return {
    lang: langFromToken,
    title,
    highlightLines,
    collapsedLines: collapsed.collapsedLines,
    collapsedMaxLines: collapsed.collapsedMaxLines,
  };
}

class EnhancedCodeBlockParser extends BaseBlockParser {
  constructor() {
    super("code");
  }

  canOpenAt(
    lines: string[],
    index: number,
    ctx: Parameters<BaseBlockParser["canOpenAt"]>[2],
  ) {
    return codeParser.canOpenAt(lines, index, ctx);
  }

  parse(
    lines: string[],
    index: number,
    ctx: Parameters<BaseBlockParser["parse"]>[2],
  ) {
    const result = codeParser.parse(lines, index, ctx);
    if (!result) return null;

    const rawLang = String(result.node.props?.lang ?? "").trim();
    if (!rawLang) return result;

    const meta = parseFenceMeta(lines[index] ?? "");
    if (!meta?.lang.trim()) return result;

    const props = { ...result.node.props };
    props.lang = meta.lang;
    if (meta.title) props.title = meta.title;
    if (meta.highlightLines.length > 0) {
      props.highlightLines = meta.highlightLines;
    }
    if (meta.collapsedLines) {
      props.collapsedLines = true;
      if (meta.collapsedMaxLines) {
        props.collapsedMaxLines = meta.collapsedMaxLines;
      }
    }

    const lang = meta.lang.toLowerCase();
    if (SPECIAL_LANGS.has(lang)) {
      props.lang = lang;
      const mw = (lines[index] ?? "").match(
        /\bmax-width=(?:"([^"]*)"|'([^']*)'|(\S+))/i,
      );
      if (mw) {
        const raw = (mw[1] ?? mw[2] ?? mw[3] ?? "").trim();
        if (raw) props.maxWidth = /^\d+(\.\d+)?$/.test(raw) ? `${raw}px` : raw;
      }
    }
    result.node.props = props;

    return result;
  }

  private renderEnhancedHtml(node: MarkdownNode, ctx: RenderContext): string {
    const props = node.props ?? {};
    const lang = String(props.lang ?? "").trim();
    const title = String(props.title ?? "").trim();
    const content = node.value ?? "";
    const highlightLines = Array.isArray(props.highlightLines)
      ? (props.highlightLines as number[])
      : [];
    const collapsedLines = Boolean(props.collapsedLines);
    const collapsedMaxLines =
      typeof props.collapsedMaxLines === "number"
        ? props.collapsedMaxLines
        : undefined;

    const collapseOpts = collapsedLines
      ? { enabled: true, maxLines: collapsedMaxLines }
      : null;
    const collapseForRender = collapseOpts
      ? analyzeCollapsedCode(content, collapseOpts)
      : null;
    const langClass = escapeHtml(lang);
    const opts = this.getOptions() as CodeOptions;
    const { html: codeBody, collapse: collapseAnalysis } =
      renderCodeBlockBodyHtml(
        content,
        langClass,
        highlightLines,
        collapseForRender,
        opts.highlightJs,
      );

    const copyBtn =
      '<button type="button" class="penna-copy-code-button" aria-label="复制代码" data-copied="已复制"></button>';
    const langLabel = `<span class="penna-code-block__lang">${langClass}</span>`;
    const titleLabel = title
      ? `<span class="penna-code-block__title">${escapeHtml(title)}</span>`
      : "";
    const header = `<div class="penna-code-block__header"><div class="penna-code-block__meta">${langLabel}${titleLabel}</div>${copyBtn}</div>`;

    const hasCollapse = Boolean(collapseAnalysis?.hasMore);
    const collapsedPanelClass = hasCollapse
      ? " penna-code-block__panel--collapsible penna-code-block__panel--collapsed"
      : "";
    const expandBtn = hasCollapse
      ? '<button type="button" class="penna-code-block__expand" aria-expanded="false"><span class="penna-code-block__expand-label">展开代码</span><span class="penna-code-block__expand-icon" aria-hidden="true"></span></button>'
      : "";

    const panelLangClass = ` language-${langClass}`;
    const extAttr = ` data-ext="${langClass}"`;
    const linesAttr =
      highlightLines.length > 0
        ? ` data-penna-highlight-lines="${escapeHtml(formatHighlightLinesAttr(highlightLines))}"`
        : "";
    const collapseAttr = hasCollapse
      ? ` data-penna-collapsed="1" data-penna-collapsed-visible="${collapseAnalysis.visibleCount}" data-penna-collapsed-max="${collapseAnalysis.maxLines}"${
          collapseAnalysis.markerLine
            ? ` data-penna-collapsed-marker="${collapseAnalysis.markerLine}"`
            : ""
        }`
      : "";
    const panel = `<div class="penna-code-block__panel${panelLangClass}${collapsedPanelClass}"${extAttr}${linesAttr}${collapseAttr}>${header}${codeBody}${expandBtn}</div>`;
    const titleAttr = title ? ` data-title="${escapeHtml(title)}"` : "";
    const langData = ` data-lang="${langClass}"`;

    let blockClass = "penna-code-block";
    if (opts.wrap) blockClass += " penna-code-wrap";
    if (opts.lineNumbers === false) blockClass += " penna-code-no-line-numbers";

    return `<div class="${blockClass}"${titleAttr}${langData}${this.sourceLineAttrs(node)}>${panel}</div>`;
  }

  private renderPlainGfmCode(node: MarkdownNode, ctx: RenderContext): string {
    const lang = String(node.props?.lang ?? "");
    const content = node.value ?? "";
    const classAttr = lang
      ? ` class="language-${escapeHtml(lang.trim())}"`
      : "";

    const opts = this.getOptions() as CodeOptions;
    const inner = renderCodeInnerHtml(content, lang, opts.highlightJs);
    const hljsClass = opts.highlightJs && content ? " hljs" : "";
    const preClass = opts.wrap ? ' class="penna-code-wrap"' : "";
    return `<pre${preClass}${this.sourceLineAttrs(node)}><code${classAttr}${hljsClass}>${inner}</code></pre>`;
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const opts = this.getOptions() as CodeOptions;
    if (!(opts.enhanced ?? opts.enable)) {
      return this.renderPlainGfmCode(node, ctx);
    }
    const lang = String(node.props?.lang ?? "")
      .trim()
      .toLowerCase();
    if (!lang) return this.renderPlainGfmCode(node, ctx);
    if (SPECIAL_LANGS.has(lang)) {
      return specialCodeParser.render(node, ctx);
    }
    return this.renderEnhancedHtml(node, ctx);
  }
}

const enhancedCodeParser = new EnhancedCodeBlockParser();

export default enhancedCodeParser;
export { enhancedCodeParser };
