/**
 * @file 块级语法拓展：文末脚注区块
 * @module transformer/extends/block/footnotes
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import {
  collectFootnoteDefinitions,
  walkNodes,
} from "@/transformer/extends/utils/footnote.js";

/** @param {number} num */
function footnoteTargetId(num) {
  return `footnote-${num}`;
}

/** @param {number} num */
function footnoteFirstRefId(num) {
  return `footnote-ref-${num}`;
}

/** @param {number} num @param {number} refIndex */
function footnoteRefId(num, refIndex) {
  return refIndex === 1
    ? footnoteFirstRefId(num)
    : `footnote-ref-${num}-${refIndex}`;
}

/**
 * @param {string} html
 * @param {string} backref
 */
function appendFootnoteBackref(html, backref) {
  const trimmed = html.trim();
  if (!trimmed) return `<p>${backref}</p>`;
  if (trimmed.endsWith("</p>")) {
    return trimmed.replace(/<\/p>\s*$/, ` ${backref}</p>`);
  }
  return `${trimmed}\n<p>${backref}</p>`;
}

/**
 * 文末脚注区块渲染器。
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

    const list = items
      .map((item) => {
        const inner = ctx.renderBlock(item.children);
        const backref = `<a href="#${footnoteFirstRefId(item.num)}" class="footnote-backref" aria-label="返回引用">↩︎</a>`;
        const body = appendFootnoteBackref(inner, backref);
        return `<li id="${footnoteTargetId(item.num)}" class="footnote-item">${body}</li>`;
      })
      .join("\n");

    return [
      `<div class="footnotes">`,
      `<hr class="footnotes-sep">`,
      `<section class="footnotes">`,
      `<ol class="footnotes-list">`,
      list,
      `</ol>`,
      `</section>`,
      `</div>`,
    ].join("\n");
  }
}

/**
 * 文档收尾：收集脚注定义、编号引用并追加 footnotes 节点。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} root
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 */
export function finalizeFootnotes(root, ctx) {
  collectFootnoteDefinitions(ctx.store.document().lines, ctx.store);
  const defs = ctx.store.document().footnoteDefinitions ?? {};

  const refs = [];
  walkNodes(root.children ?? [], (node) => {
    if (node.type === "footnote_ref") refs.push(node);
  });

  const idToNum = new Map();
  const idToRefCount = new Map();
  let num = 0;

  for (const node of refs) {
    if (!defs[node.id]) continue;

    if (!idToNum.has(node.id)) {
      num += 1;
      idToNum.set(node.id, num);
    }

    const refIndex = (idToRefCount.get(node.id) ?? 0) + 1;
    idToRefCount.set(node.id, refIndex);
    node.num = idToNum.get(node.id);
    node.refIndex = refIndex;
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
