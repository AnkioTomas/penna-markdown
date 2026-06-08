/**
 * @file Markdown AST 节点定义
 * @module transformer/core/MarkdownNode
 *
 * 节点为 plain object，字段直接挂在节点上（无 props 镜像层）。
 */

/**
 * @typedef {Object} MarkdownNode
 * @property {string} type
 * @property {string} [value]
 * @property {MarkdownNode[]} [children]
 * @property {number} [length]
 */

/**
 * 创建 AST 节点。
 *
 * @param {string} type
 * @param {Object} [fields={}]
 * @returns {MarkdownNode}
 */
export function createNode(type, fields = {}) {
  const node = { type, ...fields };

  if (fields.value === undefined && fields.children === undefined) {
    node.children = [];
  }

  return node;
}
