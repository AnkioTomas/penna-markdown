/**
 * @file 块级语法拓展：文末脚注区块
 * @module transformer/extends/block/footnotes
 *
 * 脚注定义由 footnoteDef 解析器收集；finalizeFootnotes 在文档收尾时
 * 按引用顺序生成 `footnotes` 节点并挂到 root.children。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import {
  collectFootnoteDefinitions,
  walkNodes,
} from "@/transformer/extends/utils/footnote.js";

/**
 * 文末脚注区块渲染器（不参与 parse，仅 render）。
 *
 * @extends {BaseBlockParser}
 */
class FootnotesSectionParser extends BaseBlockParser {
  constructor() {
    super({ type: "footnotes", priority: -1000, canInterruptParagraph: false });
  }

  /** @inheritdoc */
  parse() {
    return null;
  }

  /** @inheritdoc */
  render(node, ctx) {
    const { items } = node;
    if (!items?.length) return "";

    const body = items
      .map((item) => {
        const inner = ctx.renderBlock(item.children);
        const back = `<a href="#fnref:${item.num}" id="fn:${item.num}" class="footnote-ref" title="${item.id}">[${item.num}]</a>`;
        return `<div class="one-footnote">\n${back}${inner}\n</div>`;
      })
      .join("");

    return `<div class="footnote">\n<div class="footnote-title">脚注</div>${body}</div>`;
  }
}

/**
 * 文档收尾：收集脚注定义、编号引用并追加 footnotes 节点。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} root
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @returns {import('@/transformer/core/MarkdownNode.js').MarkdownNode}
 */
export function finalizeFootnotes(root, ctx) {
  collectFootnoteDefinitions(ctx.store.document().lines, ctx.store);
  const defs = ctx.store.document().footnoteDefinitions ?? {};

  const refs = [];
  walkNodes(root.children ?? [], (node) => {
    if (node.type === "footnote_ref") refs.push(node);
  });

  const idToNum = new Map();
  let num = 0;
  for (const node of refs) {
    if (!defs[node.id]) continue;
    if (!idToNum.has(node.id)) {
      num += 1;
      idToNum.set(node.id, num);
    }
    node.num = idToNum.get(node.id);
  }

  if (num === 0) return root;

  const items = [...idToNum.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id, n]) => {
      const lines = defs[id].lines;
      const children = lines.length ? ctx.parseBlocks(lines) : [];
      return { id, num: n, children };
    });

  root.children.push(createNode("footnotes", { items }));
  return root;
}

export default new FootnotesSectionParser();
