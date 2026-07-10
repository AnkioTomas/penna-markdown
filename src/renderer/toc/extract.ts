import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { HEADING_NODE_TYPES } from "@/transformer/gfm/block/atx_heading.js";
import { decodeHtmlEntities } from "@/transformer/utils/htmlEntities.js";
import { TocFlatItem } from "@/renderer/toc/TocFlatItem";
import { TocItem } from "@/renderer/toc/TocItem";

/** 行内 HTML → TOC 展示用纯文本（与预览区可见文本一致）。 */
function htmlToPlainText(html: string): string {
  const stripped = html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(stripped).replace(/\s+/g, " ").trim();
}

function headingText(node: MarkdownNode, ctx: RenderContext): string {
  return htmlToPlainText(ctx.renderInline(node.children ?? []));
}

function collectHeadings(
  nodes: MarkdownNode[] | undefined,
  out: TocFlatItem[],
  ctx: RenderContext,
): void {
  for (const node of nodes ?? []) {
    if (HEADING_NODE_TYPES.has(node.type)) {
      const text = headingText(node, ctx);
      const level = Number(node.props?.level ?? 1);
      const slug = node.props?.slug;
      out.push({
        level,
        text,
        id: typeof slug === "string" ? slug : "",
      });
    }
    collectHeadings(node.children, out, ctx);
  }
}

/**
 * 从 AST 提取扁平 TOC。
 * 须在全量/增量 parse 之后调用；`ctx` 用于与预览区相同的行内渲染。
 */
export function extractTocFlat(
  ast: MarkdownNode,
  ctx: RenderContext,
): TocFlatItem[] {
  const items: TocFlatItem[] = [];
  collectHeadings(ast.children, items, ctx);
  return items;
}

export function extractToc(ast: MarkdownNode, ctx: RenderContext): TocItem[] {
  const flat = extractTocFlat(ast, ctx);
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const item of flat) {
    const node: TocItem = { ...item, children: [] };
    while (stack.length > 0 && stack[stack.length - 1]!.level >= node.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1]!.children.push(node);
    }
    stack.push(node);
  }

  return root;
}
