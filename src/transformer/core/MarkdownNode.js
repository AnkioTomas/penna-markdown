/**
 * @file Markdown AST 节点定义
 * @module transformer/core/MarkdownNode
 *
 * 节点设计遵循 Unist（Universal Syntax Tree）惯例：
 * - 每个节点必有 `type` 字符串
 * - 叶子文本节点用 `value` 承载内容
 * - 容器节点用 `children` 承载子树
 *
 * 不再使用历史字段 `kind`，与 type 一一对应。
 */

/**
 * Markdown 抽象语法树节点。
 *
 * 构造规则（互斥）：
 * - 传入 `value` → 视为叶子（如 text），不设 children
 * - 未传 `value` → 视为容器，children 默认为 `[]`
 */
export class MarkdownNode {
  /**
   * @param {string} type - 节点类型，如 `root`、`paragraph`、`text`、`strong`
   * @param {Object} [props={}]
   * @param {string} [props.value] - 叶子文本内容（与 children 互斥）
   * @param {MarkdownNode[]} [props.children] - 子节点列表（容器节点）
   * @param {number} [props.length] - 在源文中占用的字符长度（部分行内语法用于推进游标）
   */
  constructor(type, props = {}) {
    this.type = type;

    if (props.value !== undefined) {
      this.value = props.value;
    } else {
      this.children = props.children ?? [];
    }

    if (props.length !== undefined) {
      this.length = props.length;
    }

    /** 保留原始 props 引用，便于调试或插件读取未提升字段 */
    this.props = props;
  }
}

/**
 * 创建 AST 节点的工厂函数，等价于 `new MarkdownNode(type, props)`。
 *
 * @param {string} type
 * @param {Object} [props={}]
 * @returns {MarkdownNode}
 */
export function createNode(type, props = {}) {
  return new MarkdownNode(type, props);
}
