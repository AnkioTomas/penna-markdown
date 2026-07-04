import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";

export const SOURCE_LINE_ATTR = "data-cherry-source-line";
export const SOURCE_END_LINE_ATTR = "data-cherry-source-end-line";

export const SLUG_REGISTRY_KEY = "slugRegistry";

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

/** 从节点 props 计算源码行号范围。 */
export function resolveNodeSourceLine(
  node: MarkdownNode,
): { startLine: number; endLine: number } | null {
  const startLine = node.props?.sourceStartLine;
  if (typeof startLine !== "number") return null;

  const span = node.length > 0 ? node.length : 0;
  if (span <= 0 && node.type !== "footnotes") return null;

  if (node.type === "footnotes") {
    return { startLine: startLine > 0 ? startLine - 1 : 0, endLine: startLine };
  }

  return { startLine, endLine: startLine + span };
}

/** 渲染时写入块根元素的源码行号属性。 */
export function formatSourceLineAttrs(
  node: MarkdownNode,
  options: Record<string, unknown>,
): string {
  if (!options.sourceLineMap) return "";
  const line = resolveNodeSourceLine(node);
  if (!line) return "";
  return ` ${SOURCE_LINE_ATTR}="${line.startLine}" ${SOURCE_END_LINE_ATTR}="${line.endLine}"`;
}

/** html_block 等裸 HTML 输出：仅单根元素时注入行号。 */
export function applySourceLineToRootTag(
  html: string,
  node: MarkdownNode,
  options: Record<string, unknown>,
): string {
  if (!options.sourceLineMap) return html;
  const line = resolveNodeSourceLine(node);
  if (!line || countTopLevelDomRoots(html) !== 1) return html;
  return html.replace(
    /^<([a-zA-Z][\w-]*)/,
    `<$1 ${SOURCE_LINE_ATTR}="${line.startLine}" ${SOURCE_END_LINE_ATTR}="${line.endLine}"`,
  );
}
