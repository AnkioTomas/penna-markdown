/**
 * @file 块级语法拓展：基础卡片
 * @module transformer/extends/block/card/card
 *
 * ```
 * ::: card title="标题"
 * 内容
 * :::
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  CARD_BLOCK_PRIORITY,
  pickAttr,
  readTripleColonBlock,
} from "./shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+card(?:\s+(.*))?\s*$/;

class CardBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "card", priority: CARD_BLOCK_PRIORITY });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    return {
      node: createNode(this.type, {
        title: pickAttr(block.attrs, "title"),
        children: ctx.parseBlocks(normalizeInnerLines(block.innerLines)),
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const title = String(node.title ?? "");
    const body = ctx.renderBlock(node.children ?? []);

    const parts = [`<div class="card">`];
    if (title) {
      parts.push(`<p class="card-title">${escapeHtml(title)}</p>`);
    }
    if (body) {
      parts.push(`<div class="card-body">${body}</div>`);
    }
    parts.push(`</div>`);
    return parts.join("\n");
  }
}

export const cardBlockParser = new CardBlockParser();
export default cardBlockParser;
