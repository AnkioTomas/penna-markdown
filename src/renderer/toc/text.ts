import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";

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
