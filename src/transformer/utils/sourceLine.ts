import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";

export const SOURCE_LINE_ATTR = "data-cherry-source-line";
export const SOURCE_END_LINE_ATTR = "data-cherry-source-end-line";

export function countTopLevelDomRoots(html: string, doc?: Document): number {
  if (doc) {
    const tpl = doc.createElement("template");
    tpl.innerHTML = html;
    return tpl.content.children.length;
  }

  const trimmed = html.trim();
  if (!trimmed) return 0;

  const withoutComments = trimmed.replace(/^<!--[\s\S]*?-->\s*/, "");
  if (!withoutComments) return 0;

  const tagRegex = /<\/?([a-zA-Z][\w-]*)\b[^>]*\/?>/g;
  let depth = 0;
  let roots = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(withoutComments)) !== null) {
    const token = match[0];
    const isClose = token.startsWith("</");
    const isSelfClosing = /\/>\s*$/.test(token);

    if (isClose) {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (depth === 0) {
      roots += 1;
    }

    if (!isSelfClosing && !token.startsWith("<!")) {
      depth += 1;
    }
  }

  return roots;
}

/** 与 _renderBlocks 相同的顶层块过滤规则。 */
export function isRenderedTopLevelBlock(node: MarkdownNode): boolean {
  return !node.props?.invisible && node.type !== "blank_line";
}
