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

/** `syntaxOptions.atx_heading`（setext 标题 id 亦读此配置） */
export interface AtxHeadingOptions extends ParserOptions {
  id?: boolean;
}

/** ATX / Setext 标题节点类型 */
export const HEADING_NODE_TYPES = new Set(["atx_heading", "setext_heading"]);
/** 标题文本 → slug：非法字符替换为 `-`。 */
function slugify(text: string): string {
  return text
    .trim()
    .replace(/[^\w\u4e00-\u9fff-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
    let used = store.get("atxSlugs") as Set<string>;
    if (!used) {
      used = new Set<string>();
      store.set("atxSlugs", used);
    }

    // 生成唯一 id
    const baseSlug = slugify(atx.content);
    let id = baseSlug;
    let counter = 1;
    while (used.has(id)) {
      id = `${baseSlug}-${counter}`;
      counter++;
    }
    used.add(id);

    const node = createNode(
      "atx_heading",
      1,
      undefined,
      ctx.parseInline(atx.content),
      {
        level: atx.level,
        id: id,
      },
    );
    return { node, nextIndex: index + 1 };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const level = (node.props?.level as number) || 1;
    const inner = ctx.renderInline(node.children);
    const options = this.getOptions() as AtxHeadingOptions;
    const sourceLineAttrs = this.sourceLineAttrs(node);
    const id = (node.props?.id as string) ?? null;

    if (options.slug) {
      return `<h${level} id="${escapeHtml(id)}"${sourceLineAttrs}>${inner}</h${level}>`;
    }
    return `<h${level}${sourceLineAttrs}>${inner}</h${level}>`;
  }
}

const atxHeadingParser = new HeadingBlockParser();

export default atxHeadingParser;
