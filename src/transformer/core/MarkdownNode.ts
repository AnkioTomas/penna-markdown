/**
 * @file Markdown AST 节点定义
 * @module transformer/core/MarkdownNode
 *
 * 基类只描述所有节点共有的树形结构；各语法 parser 通过索引签名挂载
 * 自有字段（如 code.lang、list.ordered、link.href、text.noMerge 等），
 * 避免在根类型上堆积大量可选属性。
 */

/** Markdown AST 节点 */
export interface MarkdownNode {
  type: string;
  length: number;
  children?: MarkdownNode[];
  value?: string;
  props?: Record<string, unknown>;
}

/**
 * 创建 AST 节点。
 *
 * - 有 `value` 或显式 `children`：按传入字段构造（text 等叶子节点不补 children）
 * - 否则视为容器节点，默认 `children: []`
 */
export function createNode(type: string, length: number,value?: string, children?: MarkdownNode[],props?: Record<string, unknown>): MarkdownNode {
  return {type, value, length, props, children};
}

