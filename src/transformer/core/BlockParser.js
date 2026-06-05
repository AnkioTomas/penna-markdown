/**
 * @file 块级语法解析引擎
 * @module transformer/core/BlockParser
 *
 * 职责：遍历行数组，按 Registry 中已排序的块级 Parser 依次尝试匹配，
 * 将识别出的块挂到 root.children，并推进行游标。
 *
 * 块级与行内解耦：块 Parser 在需要时通过 parseInline() 委托行内引擎。
 */

import { createNode } from "@/transformer/core/MarkdownNode.js";

/**
 * 块级 Markdown 解析引擎。
 */
export class BlockParseEngine {
  /**
   * @param {Object} options
   * @param {import('./Registry.js').Registry} options.registry - 语法注册表
   * @param {function(string): import('./MarkdownNode.js').MarkdownNode[]} options.parseInline -
   *   行内解析入口，由 TransformerEngine 注入，避免块/行内循环依赖
   */
  constructor({ registry, parseInline }) {
    this.registry = registry;
    this.__parseInline = parseInline;
    /** @type {import('./MarkdownNode.js').MarkdownNode | null} */
    this._root = null;
  }

  /**
   * 解析一段行内文本，供块级 Parser 在 parse() 内调用。
   *
   * @param {string} text
   * @returns {import('./MarkdownNode.js').MarkdownNode[]}
   */
  parseInline(text) {
    return this.__parseInline(text);
  }

  getRootProp(key) {
    return this._root?.props?.[key];
  }

  setRootProp(key, value) {
    if (this._root) this._root.props[key] = value;
  }

  deleteRootProp(key) {
    if (this._root) delete this._root.props[key];
  }

  /**
   * 检查当前行是否会被其他语法中断（主要用于段落）
   * @param {string[]} lines 
   * @param {number} index 
   * @returns {boolean}
   */
  checkInterrupt(lines, index) {
    for (const parser of this.registry.getBlockParsers()) {
      if (parser.canInterruptParagraph && parser.parse(lines, index, this)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 将多行 Markdown 解析为块级 AST。
   *
   * 算法概要：
   * 1. 创建 type 为 `root` 的根节点
   * 2. 对每一行 index，按 priority 从高到低调用 blockParser.parse()
   * 3. 若某 parser 返回结果，将 node 并入 root.children，index 跳到 nextIndex
   * 4. 若无一匹配，index++（跳过无法识别的行，避免死循环）
   *
   * @param {string[]} lines - 已规范化换行后的行列表
   * @returns {import('./MarkdownNode.js').MarkdownNode} root 节点
   */
  parse(lines) {
    this._root = createNode("root", { children: [] });

    let index = 0;

    while (index < lines.length) {
      let result = null;

      for (const parser of this.registry.getBlockParsers()) {
        result = parser.parse(lines, index, this, this._root.children);
        if (result) break;
      }

      if (!result) {
        index++;
        continue;
      }

      if (result.replaceLast && this._root.children.length > 0) {
        this._root.children.pop();
      }
      this._root.children.push(result.node);
      index = result.nextIndex ?? index + 1;
    }

    return this._root;
  }
}
