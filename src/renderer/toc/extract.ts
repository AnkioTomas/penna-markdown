import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { HEADING_NODE_TYPES } from "@/transformer/gfm/block/atx_heading.js";
import { TocFlatItem } from "@/renderer/toc/TocFlatItem";
import { TocItem } from "@/renderer/toc/TocItem";

function collectHeadings(
  nodes: MarkdownNode[] | undefined,
  out: TocFlatItem[],
): void {
  for (const node of nodes ?? []) {
    if (HEADING_NODE_TYPES.has(node.type)) {
      const text = node.value as string;
      const level = Number(node.props?.level ?? 1);
      const slug = node.props?.slug;
      out.push({
        level,
        text,
        id: typeof slug === "string" ? slug : "",
      });
    }
    collectHeadings(node.children, out);
  }
}

/**
 * 从 AST 提取扁平 TOC。
 * 须在全量/增量 parse 之后调用。
 */
export function extractTocFlat(ast: MarkdownNode): TocFlatItem[] {
  const items: TocFlatItem[] = [];
  collectHeadings(ast.children, items);
  return items;
}

export function extractToc(ast: MarkdownNode): TocItem[] {
  const flat = extractTocFlat(ast);
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
