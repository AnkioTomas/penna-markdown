/**
 * @file 行内语法解析引擎
 * @module transformer/core/InlineParser
 *
 * 职责：在单段字符串上从左到右扫描，由 Registry 中的行内 Parser
 * 按 priority 竞争匹配；解析会话由 store 栈帧 + finalizer 收尾。
 */

import { createNode } from "@/transformer/core/MarkdownNode.js";
import { createInlineParseContext } from "@/transformer/core/ParserContext.js";

/**
 * 行内 Markdown 解析引擎。
 */
export class InlineParseEngine {
  /**
   * @param {Object} options
   * @param {import('./Registry.js').Registry} options.registry
   * @param {import('./ParserStore.js').ParserStore} options.store -
   *   解析过程共享存储，由 TransformerEngine 注入
   */
  constructor({ registry, store }) {
    this.registry = registry;
    this.store = store;
    this.ctx = createInlineParseContext(this);
  }

  /**
   * 解析一段行内文本为 AST 节点数组。
   *
   * @param {string} src - 块内或标题内的纯文本片段
   * @returns {import('./MarkdownNode.js').MarkdownNode[]}
   */
  parse(src) {
    this.store.beginInlineFrame();
    const parsers = this.registry.getInlineParsers();
    const nodes = [];
    let index = 0;

    while (index < src.length) {
      let matched = false;

      for (const parser of parsers) {
        const result = parser.parse(src, index, this.ctx);
        if (!result) continue;

        this.appendNode(nodes, result.node);
        index = result.nextIndex;
        matched = true;
        break;
      }

      if (!matched) {
        index += 1;
      }
    }

    return this.store.endInlineFrame(
      nodes,
      this.registry.getInlineFinalizers(),
      this.ctx,
    );
  }

  /**
   * @param {import('./MarkdownNode.js').MarkdownNode[]} nodes
   * @param {import('./MarkdownNode.js').MarkdownNode | null} node
   */
  appendNode(nodes, node) {
    if (!node) return;

    const last = nodes[nodes.length - 1];

    if (
      last?.type === "text" &&
      node.type === "text" &&
      !last.noMerge &&
      !node.noMerge
    ) {
      last.value += node.value;
      return;
    }

    nodes.push(node);
  }
}
