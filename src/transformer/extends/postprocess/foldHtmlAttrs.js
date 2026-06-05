/**
 * 将 AST 中的 `html_attrs` 节点折叠到前一个兄弟节点的 props.htmlAttrs 上。
 */

function foldChildren(children) {
  if (!Array.isArray(children) || children.length === 0) return children;

  const folded = [];

  for (const node of children) {
    if (node?.type === "html_attrs") {
      const attrs = node.props?.attrs ?? "";
      const prev = folded[folded.length - 1];
      if (attrs && prev) {
        const props = prev.props ?? {};
        const merged = props.htmlAttrs ? `${props.htmlAttrs} ${attrs}` : attrs;
        prev.props = { ...props, htmlAttrs: merged };
      }
      continue;
    }

    if (node?.children?.length) {
      node.children = foldChildren(node.children);
    }
    folded.push(node);
  }

  return folded;
}

/**
 * @param {import("@/transformer/core/MarkdownNode.js").MarkdownNode} root
 */
export function foldHtmlAttrsInTree(root) {
  if (!root) return;

  if (root.children?.length) {
    root.children = foldChildren(root.children);
  }
}
