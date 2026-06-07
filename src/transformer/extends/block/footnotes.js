/**
 * 文末脚注区块渲染
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import {
  collectFootnoteDefinitions,
  walkNodes,
} from "@/transformer/extends/utils/footnote.js";

class FootnotesSectionParser extends BaseBlockParser {
  constructor() {
    super({ type: "footnotes", priority: -1000, canInterruptParagraph: false });
  }

  parse() {
    return null;
  }

  render(node, ctx) {
    const { items } = node.props;
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

/** @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} root @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx */
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
    if (!defs[node.props.id]) continue;
    if (!idToNum.has(node.props.id)) {
      num += 1;
      idToNum.set(node.props.id, num);
    }
    node.props.num = idToNum.get(node.props.id);
  }

  if (num === 0) return root;

  const items = [...idToNum.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id, n]) => {
      const lines = defs[id].lines;
      const inner = lines.length ? ctx.parse(lines) : { children: [] };
      return { id, num: n, children: inner.children };
    });

  root.children.push(createNode("footnotes", { items }));
  return root;
}

export default new FootnotesSectionParser();
