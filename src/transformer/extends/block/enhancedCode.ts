/**
 * @file 块级语法拓展：增强围栏代码块
 * @module transformer/extends/block/enhancedCode
 *
 * 解析 info string、行高亮、折叠、逐行 HTML 与顶栏渲染，均在本模块内完成。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import codeParser from "@/transformer/gfm/block/code.js";
import specialCodeParser from "@/transformer/extends/block/specialCode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { unescapeHref } from "@/transformer/utils/linkDestination.js";
import { decodeHtmlEntities } from "@/transformer/utils/htmlEntities.js";

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

/** Prism.js 最小接口，避免 transformer 硬依赖 prism 包 */
export interface PrismLike {
  languages: Record<string, unknown>;
  highlight(text: string, grammar: unknown, language: string): string;
}

export interface EnhancedCodeHighlightContext {
  highlightLines: number[];
  collapse: CollapsedCodeAnalysis | null;
}

/** 自定义高亮器；返回 `<code>` 内部 HTML */
export type EnhancedCodeHighlighter = (
  code: string,
  lang: string,
  ctx: EnhancedCodeHighlightContext,
) => string;

/** `syntaxOptions.code` 可配置项 */
export interface EnhancedCodeOptions {
  prism?: PrismLike;
  highlighter?: EnhancedCodeHighlighter;
}

// --- 行高亮 spec ---

export function parseLineHighlightSpec(spec: string): number[] {
  const lines = new Set<number>();
  for (const part of spec.split(",").map((s) => s.trim()).filter(Boolean)) {
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

export function mergeLineHighlightSpecs(...specs: Array<number[] | string>): number[] {
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

export function isFoldedCodeLine(analysis: CollapsedCodeAnalysis, lineNumber: number): boolean {
  if (!analysis.enabled || !analysis.hasMore) return false;
  return lineNumber > analysis.visibleCount;
}

export function shouldSkipCollapsedLine(analysis: CollapsedCodeAnalysis, lineNumber: number): boolean {
  return analysis.markerLine !== null && lineNumber === analysis.markerLine;
}

// --- 围栏 meta ---

function stripLangSuffixModifiers(lang: string): string {
  return lang.replace(/:collapsed-lines(?:=\d+)?/gi, "").trim();
}

function splitLangAndLineSpec(token: string): { lang: string; lineSpec: string } {
  const decoded = decodeHtmlEntities(unescapeHref(token));
  const withoutCollapse = stripLangSuffixModifiers(decoded);
  const match = withoutCollapse.match(/^([^{]*?)\{([^}]+)\}$/);
  if (match) {
    return { lang: match[1] ?? "", lineSpec: match[2] ?? "" };
  }
  return { lang: withoutCollapse, lineSpec: "" };
}

function parseCollapsedLinesMeta(
  info: string,
): { collapsedLines: boolean; collapsedMaxLines?: number } {
  const attached = info.match(/:collapsed-lines(?:=(\d+))?/i);
  if (attached) {
    return {
      collapsedLines: true,
      collapsedMaxLines: attached[1] ? Number.parseInt(attached[1], 10) : undefined,
    };
  }

  for (const token of info.split(/\s+/)) {
    const tokenMatch = token.match(/^:collapsed-lines(?:=(\d+))?$/i);
    if (tokenMatch) {
      return {
        collapsedLines: true,
        collapsedMaxLines: tokenMatch[1] ? Number.parseInt(tokenMatch[1], 10) : undefined,
      };
    }
  }

  return { collapsedLines: false };
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
  const { lang: langFromToken, lineSpec: tokenLineSpec } = splitLangAndLineSpec(firstToken);

  let highlightLines = tokenLineSpec ? parseLineHighlightSpec(tokenLineSpec) : [];

  let restInfo = info;
  if (firstToken) {
    const tokenIndex = info.indexOf(firstToken);
    if (tokenIndex >= 0) {
      restInfo = info.slice(tokenIndex + firstToken.length).trim();
    }
  }
  const infoWithoutTitle = restInfo.replace(
    /\btitle=(?:"[^"]*"|'[^']*'|[^\s]+)/gi,
    "",
  );
  for (const braceMatch of infoWithoutTitle.matchAll(/\{([0-9,\-\s]+)\}/g)) {
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

// --- 逐行 HTML（renderer hydrate 复用） ---

export function wrapCodeLineHtml(
  lineHtml: string,
  lineNumber: number,
  highlightSet: Set<number>,
  folded = false,
): string {
  const classes = ["line"];
  if (highlightSet.has(lineNumber)) {
    classes.push("cherry-code-block__line--highlighted");
  }
  if (folded) {
    classes.push("cherry-code-block__line--folded");
  }
  const body = lineHtml === "" ? " " : lineHtml;
  return `<span class="${classes.join(" ")}" data-line="${lineNumber}"><span class="cherry-code-block__ln" aria-hidden="true">${lineNumber}</span><span class="cherry-code-block__code">${body}</span></span>`;
}

export function readCodeLinesText(codeEl: ParentNode): string {
  const lines = codeEl.querySelectorAll(".line");
  if (lines.length === 0) return codeEl.textContent ?? "";

  return [...lines]
    .map(
      (line) =>
        line.querySelector(".cherry-code-block__code")?.textContent ?? line.textContent ?? "",
    )
    .join("\n");
}

const LANG_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
};

function normalizePrismLang(lang: string): string {
  const trimmed = lang.trim().toLowerCase();
  return LANG_ALIASES[trimmed] ?? trimmed;
}

/** 逐行语法高亮（SSR 与客户端 hydrate 共用） */
export function highlightCodeLinesHtml(
  prism: PrismLike,
  code: string,
  lang: string,
  highlightLines: number[] = [],
  collapse: CollapsedCodeAnalysis | null = null,
): string {
  const highlightSet = new Set(highlightLines);
  const lines = code.split("\n");
  const normalized = normalizePrismLang(lang);
  const grammar = normalized ? prism.languages[normalized] : undefined;

  return lines
    .map((line, index) => {
      const lineNumber = index + 1;
      if (collapse && shouldSkipCollapsedLine(collapse, lineNumber)) return "";

      let inner = line;
      if (grammar) {
        inner = prism.highlight(line, grammar, normalized);
      } else if (line) {
        inner = escapeHtml(line);
      }

      const folded = collapse ? isFoldedCodeLine(collapse, lineNumber) : false;
      return wrapCodeLineHtml(inner, lineNumber, highlightSet, folded);
    })
    .filter(Boolean)
    .join("");
}

function renderPlainCodeLinesHtml(
  content: string,
  highlightLines: number[] = [],
  collapse: { enabled?: boolean; maxLines?: number } | null = null,
) {
  const highlightSet = new Set(highlightLines);
  const lines = content.split("\n");
  const analysis = analyzeCollapsedCode(content, collapse ?? {});

  const html = lines
    .map((line, index) => {
      const lineNumber = index + 1;
      if (shouldSkipCollapsedLine(analysis, lineNumber)) return "";
      const folded = isFoldedCodeLine(analysis, lineNumber);
      return wrapCodeLineHtml(escapeHtml(line), lineNumber, highlightSet, folded);
    })
    .filter(Boolean)
    .join("");

  return { html, collapse: analysis };
}

function resolveCodeBody(
  opts: EnhancedCodeOptions,
  content: string,
  lang: string,
  highlightLines: number[],
  collapseOpts: { enabled: boolean; maxLines?: number } | null,
): { html: string; collapse: CollapsedCodeAnalysis; syntaxHighlighted: boolean } {
  const plain = renderPlainCodeLinesHtml(content, highlightLines, collapseOpts);
  const collapseForHighlight = collapseOpts?.enabled ? plain.collapse : null;

  if (typeof opts.highlighter === "function") {
    return {
      html: opts.highlighter(content, lang, {
        highlightLines,
        collapse: collapseForHighlight,
      }),
      collapse: plain.collapse,
      syntaxHighlighted: true,
    };
  }

  if (opts.prism) {
    return {
      html: highlightCodeLinesHtml(
        opts.prism,
        content,
        lang,
        highlightLines,
        collapseForHighlight,
      ),
      collapse: plain.collapse,
      syntaxHighlighted: true,
    };
  }

  return { html: plain.html, collapse: plain.collapse, syntaxHighlighted: false };
}

class EnhancedCodeBlockParser extends BaseBlockParser {
  constructor() {
    super("code");
  }

  canOpenAt(lines: string[], index: number, ctx: Parameters<BaseBlockParser["canOpenAt"]>[2]) {
    return codeParser.canOpenAt(lines, index, ctx);
  }

  parse(lines: string[], index: number, ctx: Parameters<BaseBlockParser["parse"]>[2]) {
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
    }
    result.node.props = props;

    return result;
  }

  private renderEnhancedHtml(node: MarkdownNode): string {
    const opts = this.getOptions() as EnhancedCodeOptions;
    const props = node.props ?? {};
    const lang = String(props.lang ?? "").trim();
    const title = String(props.title ?? "").trim();
    const content = node.value ?? "";
    const highlightLines = Array.isArray(props.highlightLines)
      ? (props.highlightLines as number[])
      : [];
    const collapsedLines = Boolean(props.collapsedLines);
    const collapsedMaxLines =
      typeof props.collapsedMaxLines === "number" ? props.collapsedMaxLines : undefined;

    const collapseOpts = collapsedLines ? { enabled: true, maxLines: collapsedMaxLines } : null;
    const { html: codeBody, collapse: collapseAnalysis, syntaxHighlighted } = resolveCodeBody(
      opts,
      content,
      lang,
      highlightLines,
      collapseOpts,
    );

    const langClass = escapeHtml(lang);
    const codeClasses = syntaxHighlighted
      ? `language-${langClass} cherry-code-block__highlighted`
      : `language-${langClass}`;
    const highlightedAttr = syntaxHighlighted ? ' data-cherry-highlighted="1"' : "";
    const codeHtml = `<pre class="cherry-code-block__pre cherry-code-block__pre--lines"><code class="${codeClasses}" data-cherry-code${highlightedAttr}>${codeBody}</code></pre>`;
    const copyBtn =
      '<button type="button" class="cherry-copy-code-button" aria-label="复制代码" data-copied="已复制"></button>';
    const langLabel = `<span class="cherry-code-block__lang">${langClass}</span>`;
    const titleLabel = title
      ? `<span class="cherry-code-block__title">${escapeHtml(title)}</span>`
      : "";
    const header = `<div class="cherry-code-block__header"><div class="cherry-code-block__meta">${langLabel}${titleLabel}</div>${copyBtn}</div>`;

    const hasCollapse = Boolean(collapseAnalysis?.hasMore);
    const collapsedPanelClass = hasCollapse
      ? " cherry-code-block__panel--collapsible cherry-code-block__panel--collapsed"
      : "";
    const expandBtn = hasCollapse
      ? '<button type="button" class="cherry-code-block__expand" aria-expanded="false"><span class="cherry-code-block__expand-label">展开代码</span><span class="cherry-code-block__expand-icon" aria-hidden="true"></span></button>'
      : "";

    const panelLangClass = ` language-${langClass}`;
    const extAttr = ` data-ext="${langClass}"`;
    const linesAttr =
      highlightLines.length > 0
        ? ` data-cherry-highlight-lines="${escapeHtml(formatHighlightLinesAttr(highlightLines))}"`
        : "";
    const collapseAttr = hasCollapse
      ? ` data-cherry-collapsed="1" data-cherry-collapsed-visible="${collapseAnalysis.visibleCount}" data-cherry-collapsed-max="${collapseAnalysis.maxLines}"${
          collapseAnalysis.markerLine
            ? ` data-cherry-collapsed-marker="${collapseAnalysis.markerLine}"`
            : ""
        }`
      : "";
    const panel = `<div class="cherry-code-block__panel${panelLangClass}${collapsedPanelClass}"${extAttr}${linesAttr}${collapseAttr}>${header}${codeHtml}${expandBtn}</div>`;
    const titleAttr = title ? ` data-title="${escapeHtml(title)}"` : "";
    const langData = ` data-lang="${langClass}"`;

    return `<div class="cherry-code-block"${titleAttr}${langData}>${panel}</div>`;
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const lang = String(node.props?.lang ?? "").trim().toLowerCase();
    if (!lang) return codeParser.render(node);
    if (SPECIAL_LANGS.has(lang)) {
      return specialCodeParser.render(node, ctx);
    }
    return this.renderEnhancedHtml(node);
  }
}

const enhancedCodeParser = new EnhancedCodeBlockParser();

export default enhancedCodeParser;
export { enhancedCodeParser };
