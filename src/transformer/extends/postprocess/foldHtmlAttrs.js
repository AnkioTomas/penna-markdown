/**
 * @file html_attrs AST 后处理：属性折叠
 * @module transformer/extends/postprocess/foldHtmlAttrs
 *
 * 将 AST 中的 `html_attrs` 节点折叠到前一个兄弟节点的 props.htmlAttrs 上，
 * 以便后续渲染时由 injectAttrs 注入到对应 HTML 开标签。
 */

/**
 * @typedef {import("@/transformer/core/MarkdownNode.js").MarkdownNode} MarkdownNode
 */

/**
 * 递归折叠子节点列表中的 html_attrs 节点。
 *
 * 遇到 `html_attrs` 时将其 props.attrs 合并到 folded 数组中前一节点的
 * props.htmlAttrs，并丢弃 html_attrs 节点本身；其余节点递归处理 children 后保留。
 *
 * @param {MarkdownNode[] | null | undefined} children
 * @returns {MarkdownNode[] | null | undefined}
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
 * 对整棵 AST 根节点执行 html_attrs 折叠（DocumentFinalizer / afterParse 入口）。
 *
 * @param {MarkdownNode | null | undefined} root
 * @returns {void}
 */
export function foldHtmlAttrsInTree(root) {
  if (!root) return;

  if (root.children?.length) {
    root.children = foldChildren(root.children);
  }
}
