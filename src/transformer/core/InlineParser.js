/**
 * @file 行内语法解析引擎
 * @module transformer/core/InlineParser
 *
 * 职责：在单段字符串上从左到右扫描，由 Registry 中的行内 Parser
 * 按 priority 竞争匹配；匹配到的节点经 appendNode 合并相邻 text。
 */

import { createNode } from "@/transformer/core/MarkdownNode.js";

/**
 * 行内 Markdown 解析引擎。
 */
export class InlineParseEngine {
  /**
   * @param {Object} options
   * @param {import('./Registry.js').Registry} options.registry
   */
  constructor({ registry }) {
    this.registry = registry;
  }

  /**
   * 解析一段行内文本为 AST 节点数组。
   *
   * 算法概要：
   * 1. 维护游标 index，从 0 遍历至 src.length
   * 2. 对每个 index，按 priority 调用 inlineParser.parse(src, index, parseInline)
   * 3. parseInline 回调指向本引擎的 parse()，用于处理嵌套行内结构
   * 4. 首个返回非 null 的 parser 获胜，节点入栈，index 设为 nextIndex
   * 5. 若全部 parser 均未匹配，由兜底逻辑处理（通常由 priority 最低的 text 接管）
   *
   * @param {string} src - 块内或标题内的纯文本片段
   * @returns {import('./MarkdownNode.js').MarkdownNode[]}
   */
  parse(src) {
    const parsers = this.registry.getInlineParsers();

    const nodes = [];

    let index = 0;

    while (index < src.length) {
      let matched = false;

      let lastNode = null;
      for (const parser of parsers) {
        const result = parser.parse(src, index, (sub) => this.parse(sub));

        if (!result) {
          continue;
        }
        lastNode = result.node;
        this.appendNode(nodes, result.node);

        index = result.nextIndex;

        matched = true;
        break;
      }

      if (matched) {
        continue;
      }

      this.appendNode(nodes, lastNode);
    }

    return nodes;
  }

  /**
   * 将节点追加到结果列表，并合并相邻的 text 节点以减少 AST 碎片。
   *
   * 例如连续两次解析出 `{ type: 'text', value: 'a' }` 与 `{ value: 'b' }`
   * 会合并为单个 `{ value: 'ab' }`，渲染时更高效。
   *
   * @param {import('./MarkdownNode.js').MarkdownNode[]} nodes - 已解析节点列表（原地修改）
   * @param {import('./MarkdownNode.js').MarkdownNode | null} node - 待追加节点
   */
  appendNode(nodes, node) {
    const last = nodes[nodes.length - 1];

    if (last?.type === "text" && node?.type === "text") {
      last.value += node.value;
      return;
    }

    nodes.push(node);
  }
}
