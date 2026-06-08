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
import { BlockParseContext } from "@/transformer/core/ParserContext.js";

/**
 * 块级 Markdown 解析引擎。
 */
export class BlockParseEngine {
  /**
   * @param {Object} options
   * @param {import('./Registry.js').Registry} options.registry - 语法注册表
   * @param {import('./ParserStore.js').ParserStore} options.store -
   *   解析过程共享存储，由 TransformerEngine 注入
   * @param {function(string): import('./MarkdownNode.js').MarkdownNode[]} options.parseInline -
   *   行内解析入口，由 TransformerEngine 注入，避免块/行内循环依赖
   */
  constructor({ registry, store, parseInline }) {
    this.registry = registry;
    this.store = store;
    this.__parseInline = parseInline;
    this.ctx = new BlockParseContext(this);
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

  /**
   * 检查当前行是否会被其他语法中断（主要用于段落）
   * @param {string[]} lines
   * @param {number} index
   * @returns {boolean}
   */
  checkInterrupt(lines, index) {
    for (const parser of this.registry.getBlockParsers()) {
      if (!parser.canInterruptParagraph) continue;

      if (typeof parser.canOpenAt === "function") {
        if (parser.canOpenAt(lines, index, this.ctx)) return true;
        continue;
      }

      const prevPrevNodes = this.ctx.prevNodes;
      this.ctx.prevNodes = undefined;
      const interrupted = !!parser.parse(lines, index, this.ctx);
      this.ctx.prevNodes = prevPrevNodes;
      if (interrupted) return true;
    }
    return false;
  }

  /**
   * 文档解析收尾：依次执行 document finalizer
   *
   * @param {import('./MarkdownNode.js').MarkdownNode} root
   * @returns {import('./MarkdownNode.js').MarkdownNode}
   */
  finalizeDocument(root) {
    let result = root;
    for (const fn of this.registry.getDocumentFinalizers()) {
      result = fn(result, this.ctx) ?? result;
    }
    return result;
  }

  /**
   * 解析多行文本为块级 children（无 root、不触发 document finalizer）。
   *
   * @param {string[]} lines
   * @returns {import('./MarkdownNode.js').MarkdownNode[]}
   */
  parseBlocks(lines) {
    const children = [];
    let index = 0;

    while (index < lines.length) {
      let result = null;

      for (const parser of this.registry.getBlockParsers()) {
        this.ctx.prevNodes = children;
        result = parser.parse(lines, index, this.ctx);
        if (result) break;
      }

      if (!result) {
        index++;
        continue;
      }

      if (result.replaceLast && children.length > 0) {
        children.pop();
      }
      if (result.node) {
        children.push(result.node);
      }
      index = result.nextIndex ?? index + 1;
    }

    return children;
  }

  /**
   * 将多行 Markdown 解析为块级 AST。
   *
   * @param {string[]} lines - 已规范化换行后的行列表
   * @returns {import('./MarkdownNode.js').MarkdownNode} root 节点
   */
  parse(lines) {
    this.store.document().lines = lines;
    const root = createNode("root", { children: this.parseBlocks(lines) });
    return this.finalizeDocument(root);
  }
}
