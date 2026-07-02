import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { TocFlatItem, TocItem } from "../types.js";
import { assignSlug, createSlugRegistry } from "./slug.js";
import { extractHeadingText } from "./text.js";

const HEADING_TYPES = new Set(["atx_heading", "setext_heading"]);

function collectHeadings(
  nodes: MarkdownNode[] | undefined,
  out: TocFlatItem[],
  used: Set<string>,
): void {
  for (const node of nodes ?? []) {
    if (HEADING_TYPES.has(node.type)) {
      const text = extractHeadingText(node);
      const level = Number(node.props?.level ?? 1);
      out.push({
        level,
        text,
        id: assignSlug(text, used),
      });
    }
    collectHeadings(node.children, out, used);
  }
}

export function extractTocFlat(ast: MarkdownNode): TocFlatItem[] {
  const items: TocFlatItem[] = [];
  collectHeadings(ast.children, items, createSlugRegistry());
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
