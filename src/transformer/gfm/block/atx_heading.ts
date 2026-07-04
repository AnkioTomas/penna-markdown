/**
 * @file 块级语法：标题
 * @module transformer/gfm/block/heading
 *
 * ATX 标题（# ~ ######）
 * slug 配置：`syntaxOptions.atx_heading`（setext 标题共用）
 */

import { BaseBlockParser, type ParserOptions } from "@/transformer/core/ParserBase.js";
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";
import { escapeHtml, isEscaped } from "@/transformer/utils/escape.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { SLUG_REGISTRY_KEY } from "@/transformer/utils/sourceLine.js";

/** `syntaxOptions.atx_heading`（setext 标题 slug 亦读此配置） */
export interface AtxHeadingOptions extends ParserOptions {
  slug?: boolean;
}

/** 从 heading AST 节点提取纯文本标题。 */
export function extractHeadingText(node: MarkdownNode): string {
  if (node.value !== undefined) return node.value;
  if (!node.children?.length) return "";

  return node.children
    .map((child) => {
      if (child.type === "html_attrs") return "";
      if (child.type === "image") return String(child.props?.alt ?? "");
      return extractHeadingText(child);
    })
    .join("");
}

/** 标题文本 → slug：非法字符替换为 `-`。 */
export function slugify(text: string): string {
  const slug = text
    .trim()
    .replace(/[^\w\u4e00-\u9fff-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "heading";
}

/** 文档序去重：重复 slug 追加 `-1`、`-2`… */
export function assignSlug(text: string, used: Set<string>): string {
  const base = slugify(text);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let index = 1;
  while (used.has(`${base}-${index}`)) {
    index += 1;
  }
  const id = `${base}-${index}`;
  used.add(id);
  return id;
}

export function createSlugRegistry(): Set<string> {
  return new Set<string>();
}

export function ensureSlugRegistry(
  store: { get<T>(key: string): T | undefined; set(key: string, value: unknown): void },
  key: string,
): Set<string> {
  const existing = store.get<Set<string>>(key);
  if (existing) return existing;
  const registry = createSlugRegistry();
  store.set(key, registry);
  return registry;
}

/** GFM：可选闭合 `#` 须未被转义，且闭合序列前须有空格。 */
function trimAtxContent(raw: string): string {
  const trimmedEnd = raw.replace(/[ \t]+$/, "");
  let i = trimmedEnd.length;
  while (i > 0 && trimmedEnd[i - 1] === "#") {
    if (isEscaped(trimmedEnd, i - 1)) break;
    i -= 1;
  }
  if (i < trimmedEnd.length && i > 0 && (trimmedEnd[i - 1] === " " || trimmedEnd[i - 1] === "\t")) {
    return trimmedEnd.slice(0, i - 1).trim();
  }
  return raw.trim();
}

function getAtxHeadingInfo(line: string): { level: number; content: string } | null {
    const start = skipBlockPrefixSpaces(line);
    if (start >= line.length || line[start] !== '#') return null;

    let i = start;
    let level = 0;
    while (i < line.length && line[i] === '#' && level < 6) { level++; i++; }
    if (level === 0 || (i < line.length && line[i] === '#')) return null;
    if (i < line.length && line[i] !== ' ' && line[i] !== '\t') return null;

    const content = trimAtxContent(line.slice(i));
    return { level, content };
}

export function getAtxHeadingOptions(): AtxHeadingOptions {
  return atxHeadingParser.getOptions() as AtxHeadingOptions;
}

/** ATX / Setext 标题共用 slug 渲染 */
export function renderHeadingHtml(
  node: MarkdownNode,
  ctx: RenderContext,
  level: number,
  inner: string,
  options: AtxHeadingOptions,
  sourceLineAttrs: string,
): string {
  if (options.slug) {
    const id = assignSlug(
      extractHeadingText(node),
      ensureSlugRegistry(ctx.store, SLUG_REGISTRY_KEY),
    );
    return `<h${level} id="${escapeHtml(id)}"${sourceLineAttrs}>${inner}</h${level}>`;
  }
  return `<h${level}${sourceLineAttrs}>${inner}</h${level}>`;
}

class HeadingBlockParser extends BaseBlockParser {
    constructor() { super("atx_heading"); }

    canOpenAt(lines: string[], index: number, ctx: BlockParseContext) {
        return getAtxHeadingInfo(lines[index] ?? "") !== null;
    }

    parse(lines: string[], index: number, ctx: BlockParseContext) {
        const line = lines[index] ?? "";
        const atx = getAtxHeadingInfo(line);
        if (atx) {
            const node = createNode("atx_heading", 1, undefined, ctx.parseInline(atx.content), {
                level: atx.level
            });
            return { node, nextIndex: index + 1 };
        }
        return null;
    }

    render(node: MarkdownNode, ctx: RenderContext) {
        const level = node.props?.level as number || 1;
        const inner = ctx.renderInline(node.children);
        return renderHeadingHtml(
          node,
          ctx,
          level,
          inner,
          this.getOptions() as AtxHeadingOptions,
          this.sourceLineAttrs(node),
        );
    }
}

const atxHeadingParser = new HeadingBlockParser();

export default atxHeadingParser;
