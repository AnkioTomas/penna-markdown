/**
 * @file Markdown AST 节点
 * @module transformer/core/MarkdownNode
 */

/**
 * AST 节点。
 *
 * @property type     - 节点类型（`paragraph` / `text` / `code` …）
 * @property length   - 块级节点：吞掉的源码行数；行内节点：源文本跨度（字符数）
 * @property value    - 字面量文本（`text`、`html` 等叶子节点）
 * @property children - 子节点（块级容器、行内包装节点）
 * @property props    - 语法扩展属性（`href`、`lang`、`ordered`、`noMerge` …）
 */
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
 * @param type     - 节点类型
 * @param length   - 块级：行数；行内：字符跨度
 * @param value    - 字面量文本（可选）
 * @param children - 子节点（可选）
 * @param props    - 扩展属性（可选）
 */
export function createNode(
  type: string,
  length: number,
  value?: string,
  children?: MarkdownNode[],
  props?: Record<string, unknown>,
): MarkdownNode {
  return { type, value, length, props, children };
}

/** 行内节点在父容器拼接文本中的字符跨度（仅用于行内 AST）。 */
export function inlineSourceSpan(node: MarkdownNode): number {
  return node.length;
}
