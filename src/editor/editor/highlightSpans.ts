/**
 * @file 从 transformer 解析结果提取编辑器高亮 span
 * @module editor/editor/highlightSpans
 *
 * 单一语法真相源：复用 TransformerEngine 的 block/inline parser，不引入 Lezer 扩展。
 */

import { BlockParseEngine } from "@/transformer/core/BlockParser.js";
import { InlineParseEngine } from "@/transformer/core/InlineParser.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { inlineSourceSpan } from "@/transformer/core/MarkdownNode.js";
import { ParserStore } from "@/transformer/core/ParserStore.js";
import { Registry } from "@/transformer/core/Registry.js";
import type { TransformerEngineOptions } from "@/transformer/TransformerEngineOptions";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";
import { isIndentedCodeLine, stripVisualIndent } from "@/transformer/utils/tabs.js";

export interface EditorHighlightSpan {
  from: number;
  to: number;
  class: string;
}

export interface HighlightSpanOptions {
  blockClasses?: Record<string, string>;
  inlineClasses?: Record<string, string>;
  transformerEngineOptions?: TransformerEngineOptions;
}

/** Cherry 扩展块级语法 → CM decoration class */
export const DEFAULT_BLOCK_HIGHLIGHT_CLASSES: Record<string, string> = {
  alert: "cm-ext-alert",
  math_block: "cm-ext-math-block",
  collapse: "cm-ext-collapse",
  tabs: "cm-ext-tabs",
  steps: "cm-ext-steps",
  timeline: "cm-ext-timeline",
  container: "cm-ext-container",
  card: "cm-ext-card",
  card_grid: "cm-ext-card-grid",
  card_masonry: "cm-ext-card-masonry",
  image_card: "cm-ext-image-card",
  link_card: "cm-ext-link-card",
  repo_card: "cm-ext-repo-card",
  field: "cm-ext-field",
  field_group: "cm-ext-field-group",
  footnotes: "cm-ext-footnotes",
};

/** Cherry 扩展行内语法 → CM decoration class */
export const DEFAULT_INLINE_HIGHLIGHT_CLASSES: Record<string, string> = {
  highlight: "cm-ext-highlight",
  emoji: "cm-ext-emoji",
  spoiler: "cm-ext-spoiler",
  math_inline: "cm-ext-math-inline",
  badge: "cm-ext-badge",
  inline_comment: "cm-ext-comment",
  footnote_ref: "cm-ext-footnote",
  frontmatter_var: "cm-ext-frontmatter-var",
  html_attrs: "cm-ext-html-attrs",
  sub: "cm-ext-sub",
  sup: "cm-ext-sup",
  media: "cm-ext-media",
  media_embed: "cm-ext-media",
  iframe_embed: "cm-ext-iframe",
};

const FRONTMATTER_CLASS = "cm-ext-frontmatter";

const INLINE_CONTAINER_TYPES = new Set(["paragraph", "atx_heading", "setext_heading"]);

function isFrontmatterFence(line: string): boolean {
  const s = line.trimEnd();
  if (s.length < 3 || s[0] !== "-" || s[1] !== "-" || s[2] !== "-") return false;
  const next = s[3];
  return next === undefined || next === " " || next === "\t";
}

function splitDocLines(doc: string): { lines: string[]; lineOffsets: number[] } {
  const text = doc.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");
  if (text.endsWith("\n") && lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  const lineOffsets: number[] = [];
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    lineOffsets.push(offset);
    offset += lines[i]!.length + (i < lines.length - 1 ? 1 : 0);
  }
  return { lines, lineOffsets };
}

function blockDocRange(
  lines: string[],
  lineOffsets: number[],
  startLine: number,
  endLineExclusive: number,
): { from: number; to: number } {
  const from = lineOffsets[startLine] ?? 0;
  const lastLine = endLineExclusive - 1;
  if (lastLine < startLine) return { from, to: from };
  const to = (lineOffsets[lastLine] ?? 0) + (lines[lastLine]?.length ?? 0);
  return { from, to };
}

function buildSingleLineContentMap(line: string, lineOffset: number, content: string): number[] {
  const idx = line.indexOf(content);
  if (idx < 0) return [];
  const base = lineOffset + idx;
  return Array.from({ length: content.length }, (_, j) => base + j);
}

function buildParagraphContentMap(
  lines: string[],
  lineOffsets: number[],
  startLine: number,
  endLineExclusive: number,
): { content: string; map: number[] } {
  const map: number[] = [];
  let content = "";

  for (let li = startLine; li < endLineExclusive; li++) {
    if (li > startLine) {
      content += "\n";
      map.push((lineOffsets[li] ?? 0) - 1);
    }
    const line = lines[li] ?? "";
    let text: string;
    if (li > startLine && isIndentedCodeLine(line)) {
      text = stripVisualIndent(line);
    } else {
      text = line.slice(skipBlockPrefixSpaces(line));
    }
    const docStart = lineOffsets[li]! + (line.length - text.length);
    for (let j = 0; j < text.length; j++) {
      map.push(docStart + j);
    }
    content += text;
  }

  const trimmed = content.replace(/[ \t]+$/, "");
  while (content.length > trimmed.length) {
    content = content.slice(0, -1);
    map.pop();
  }

  return { content, map };
}

function getAtxHeadingContent(line: string): string | null {
  const start = skipBlockPrefixSpaces(line);
  if (start >= line.length || line[start] !== "#") return null;
  let i = start;
  let level = 0;
  while (i < line.length && line[i] === "#" && level < 6) {
    level += 1;
    i += 1;
  }
  if (level === 0 || (i < line.length && line[i] === "#")) return null;
  if (i < line.length && line[i] !== " " && line[i] !== "\t") return null;
  return line.slice(i).replace(/[ \t]+$/, "").replace(/\s+#+\s*$/, "").trim();
}

function walkInlineNodes(
  nodes: MarkdownNode[],
  inlineClasses: Record<string, string>,
  map: number[],
  spans: EditorHighlightSpan[],
): void {
  let cursor = 0;
  for (const node of nodes) {
    const len = inlineSourceSpan(node);
    const cls = inlineClasses[node.type];
    if (cls && len > 0 && cursor + len <= map.length) {
      const from = map[cursor]!;
      const to = map[cursor + len - 1]! + 1;
      if (from < to) spans.push({ from, to, class: cls });
    }
    cursor += len;
  }
}

function collectInlineSpansForBlock(
  node: MarkdownNode,
  lines: string[],
  lineOffsets: number[],
  startLine: number,
  endLineExclusive: number,
  inlineClasses: Record<string, string>,
  spans: EditorHighlightSpan[],
): void {
  if (!node.children?.length || !INLINE_CONTAINER_TYPES.has(node.type)) return;

  if (node.type === "paragraph") {
    const { map } = buildParagraphContentMap(lines, lineOffsets, startLine, endLineExclusive);
    if (map.length > 0) walkInlineNodes(node.children, inlineClasses, map, spans);
    return;
  }

  if (node.type === "atx_heading") {
    const line = lines[startLine] ?? "";
    const content = getAtxHeadingContent(line);
    if (!content) return;
    const map = buildSingleLineContentMap(line, lineOffsets[startLine] ?? 0, content);
    if (map.length > 0) walkInlineNodes(node.children, inlineClasses, map, spans);
  }
}

function createParseEngines(options?: TransformerEngineOptions) {
  const registry = new Registry();
  if (options?.inlineParsers) {
    for (const [pri, parser] of Object.entries(options.inlineParsers)) {
      registry.registerInlineParser(parser, Number(pri));
    }
  }
  if (options?.blockParsers) {
    for (const [pri, parser] of Object.entries(options.blockParsers)) {
      registry.registerBlockParser(parser, Number(pri));
    }
  }
  if (options?.syntaxOptions) {
    registry.setOptions(options.syntaxOptions);
  }

  const lines: string[] = [];
  const store = new ParserStore(lines);
  const inlineEngine = new InlineParseEngine(registry, store);
  const blockEngine = new BlockParseEngine(registry, store, (text) => inlineEngine.parse(text));
  return { blockEngine, store };
}

function mergeSpanOptions(options?: HighlightSpanOptions) {
  return {
    blockClasses: { ...DEFAULT_BLOCK_HIGHLIGHT_CLASSES, ...options?.blockClasses },
    inlineClasses: { ...DEFAULT_INLINE_HIGHLIGHT_CLASSES, ...options?.inlineClasses },
    transformerEngineOptions: options?.transformerEngineOptions,
  };
}

/** 从 markdown 原文收集编辑器 decoration span（doc 坐标系）。 */
export function collectHighlightSpans(
  markdown: string,
  options?: HighlightSpanOptions,
): EditorHighlightSpan[] {
  const { blockClasses, inlineClasses, transformerEngineOptions } = mergeSpanOptions(options);
  const { lines, lineOffsets } = splitDocLines(markdown);
  if (lines.length === 0) return [];

  const parseSource = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const normalized = parseSource.endsWith("\n") ? parseSource : `${parseSource}\n`;
  const parseLines = normalized.split("\n");
  if (parseLines.length > 0 && parseLines[parseLines.length - 1] === "") parseLines.pop();

  const { blockEngine } = createParseEngines(transformerEngineOptions);
  const spans: EditorHighlightSpan[] = [];
  let lineIndex = 0;

  while (lineIndex < parseLines.length) {
    const { nextIndex, node } = blockEngine.parseBlockAt(parseLines, lineIndex);
    const safeNext = nextIndex > lineIndex ? nextIndex : lineIndex + 1;

    const blockClass = node ? blockClasses[node.type] : undefined;
    if (blockClass) {
      const { from, to } = blockDocRange(lines, lineOffsets, lineIndex, safeNext);
      if (from < to) spans.push({ from, to, class: blockClass });
    } else if (
      !node
      && lineIndex === 0
      && safeNext > 1
      && isFrontmatterFence(parseLines[0] ?? "")
    ) {
      const { from, to } = blockDocRange(lines, lineOffsets, lineIndex, safeNext);
      if (from < to) spans.push({ from, to, class: FRONTMATTER_CLASS });
    }

    if (node) {
      collectInlineSpansForBlock(
        node,
        lines,
        lineOffsets,
        lineIndex,
        safeNext,
        inlineClasses,
        spans,
      );
    }

    lineIndex = safeNext;
  }

  return dedupeSpans(spans);
}

function dedupeSpans(spans: EditorHighlightSpan[]): EditorHighlightSpan[] {
  const seen = new Set<string>();
  const out: EditorHighlightSpan[] = [];
  for (const span of spans.sort((a, b) => a.from - b.from || a.to - b.to)) {
    const key = `${span.from}:${span.to}:${span.class}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(span);
  }
  return out;
}
