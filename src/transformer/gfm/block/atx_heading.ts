/**
 * @file 块级语法：标题
 * @module transformer/gfm/block/heading
 *
 * ATX 标题（# ~ ######）
 * id 配置：`syntaxOptions.atx_heading.id`（setext 标题共用）
 */

import {
  BaseBlockParser,
  type ParserOptions,
} from "@/transformer/core/ParserBase.js";
import {
  createNode,
  type MarkdownNode,
} from "@/transformer/core/MarkdownNode.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";
import { escapeHtml, isEscaped } from "@/transformer/utils/escape.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { ParserStore } from "@/transformer/core/ParserStore";

/** ATX 和 Setext 标题节点类型 */
export const HEADING_NODE_TYPES = new Set(["atx_heading", "setext_heading"]);

export interface AtxHeadingOptions extends ParserOptions {
  slug?: boolean;
}
/** 标题文本 → slug：非法字符替换为 `-`。 */
function slugify(text: string): string {
  return text
    .trim()
    .replace(/[^\w\u4e00-\u9fff-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isSlug(options: ParserOptions) {
  return (options as AtxHeadingOptions).slug!!;
}

/**
 * 标题文本 → id：生成唯一 id（带去重）。
 * 去 重逻辑由 store 中的 atxSlugs 注册表保证。
 */
export function assignId(text: string, store: ParserStore): string {
  const base = slugify(text);

  // 获取全局注册表
  let used = store.get("atxSlugs") as Set<string>;
  if (!used) {
    used = new Set<string>();
    store.set("atxSlugs", used);
  }

  // 生成唯一 id
  let id = base;
  let index = 1;
  while (used.has(id)) {
    id = `${base}-${index}`;
    index++;
  }
  used.add(id);

  return id;
}

/** 渲染标题 HTML，支持可选 id 属性。 */
export function renderHeadingHtml(
  node: MarkdownNode,
  ctx: RenderContext,
  slug: boolean,
  sourceLineAttrs: string,
): string {
  const level = (node.props?.level as number) || 1;
  const inner = ctx.renderInline(node.children);
  const id = (node.props?.slug as string) ?? null;

  if (!slug) {
    return `<h${level}${sourceLineAttrs}>${inner}</h${level}>`;
  }
  return `<h${level} id="${escapeHtml(id ?? "")}"${sourceLineAttrs}>${inner}</h${level}>`;
}

function getAtxHeadingInfo(
  line: string,
): { level: number; content: string } | null {
  const start = skipBlockPrefixSpaces(line);
  if (start >= line.length || line[start] !== "#") return null;

  let i = start;
  let level = 0;
  while (i < line.length && line[i] === "#" && level < 6) {
    level++;
    i++;
  }
  if (level === 0 || (i < line.length && line[i] === "#")) return null;
  if (i < line.length && line[i] !== " " && line[i] !== "\t") return null;

  const content = trimAtxContent(line.slice(i));
  return { level, content };
}

function trimAtxContent(raw: string): string {
  const trimmedEnd = raw.replace(/[ \t]+$/, "");
  let i = trimmedEnd.length;
  while (i > 0 && trimmedEnd[i - 1] === "#") {
    if (isEscaped(trimmedEnd, i - 1)) break;
    i -= 1;
  }
  if (
    i < trimmedEnd.length &&
    i > 0 &&
    (trimmedEnd[i - 1] === " " || trimmedEnd[i - 1] === "\t")
  ) {
    return trimmedEnd.slice(0, i - 1).trim();
  }
  return raw.trim();
}
class HeadingBlockParser extends BaseBlockParser {
  constructor() {
    super("atx_heading");
  }

  canOpenAt(lines: string[], index: number, ctx: BlockParseContext) {
    return getAtxHeadingInfo(lines[index] ?? "") !== null;
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    const atx = getAtxHeadingInfo(line);
    if (!atx) return null;

    // 获取全局 id 注册表
    const store = ctx.store;

    const node = createNode(
      "atx_heading",
      1,
      atx.content,
      ctx.parseInline(atx.content),
      {
        level: atx.level,
        slug: isSlug(this.getOptions()) ? assignId(atx.content, store) : "",
      },
    );
    return { node, nextIndex: index + 1 };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const sourceLineAttrs = this.sourceLineAttrs(node);

    return renderHeadingHtml(
      node,
      ctx,
      isSlug(this.getOptions()),
      sourceLineAttrs,
    );
  }
}

const atxHeadingParser = new HeadingBlockParser();

export default atxHeadingParser;
