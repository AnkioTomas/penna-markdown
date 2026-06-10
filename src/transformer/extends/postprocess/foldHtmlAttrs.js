/**
 * @file html_attrs AST 后处理：属性折叠
 * @module transformer/extends/postprocess/foldHtmlAttrs
 *
 * 将 AST 中的 `html_attrs` 节点折叠到前一个兄弟节点的 htmlAttrs 上，
 * 以便后续渲染时由 injectAttrs 注入到对应 HTML 开标签。
 */

/**
 * @typedef {import("@/transformer/core/MarkdownNode.js").MarkdownNode} MarkdownNode
 */

/**
 * 向前跳过仅含空白的 text 节点，找到可挂载属性的兄弟节点。
 *
 * @param {MarkdownNode[]} folded
 * @returns {MarkdownNode | null}
 */
function findAttrTarget(folded) {
  for (let i = folded.length - 1; i >= 0; i -= 1) {
    const node = folded[i];
    if (node?.type === "text" && !String(node.value ?? "").trim()) continue;
    if (node?.type === "text") return null;
    return node;
  }
  return null;
}

/**
 * @param {MarkdownNode[] | null | undefined} children
 * @returns {MarkdownNode[] | null | undefined}
 */
function foldChildren(children) {
  if (!Array.isArray(children) || children.length === 0) return children;

  const folded = [];

  for (const node of children) {
    if (node?.type === "html_attrs") {
      const attrs = node.attrs ?? "";
      const prev = findAttrTarget(folded);
      if (attrs && prev) {
        prev.htmlAttrs = prev.htmlAttrs ? `${prev.htmlAttrs} ${attrs}` : attrs;
        while (
          folded.length > 0 &&
          folded[folded.length - 1] !== prev &&
          folded[folded.length - 1]?.type === "text" &&
          !String(folded[folded.length - 1].value ?? "").trim()
        ) {
          folded.pop();
        }
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
 * @param {MarkdownNode | null | undefined} root
 * @returns {void}
 */
export function foldHtmlAttrsInTree(root) {
  if (!root) return;

  if (root.children?.length) {
    root.children = foldChildren(root.children);
  }
}
