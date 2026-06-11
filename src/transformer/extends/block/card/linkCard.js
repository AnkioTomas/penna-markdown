/**
 * @file 块级语法拓展：链接卡片
 * @module transformer/extends/block/card/linkCard
 *
 * ```
 * ::: link-card title="文档" link="https://example.com"
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
  parseTitleInline,
  pickAttr,
  readTripleColonBlock,
} from "./shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+link-card(?:\s+(.*))?\s*$/;

class LinkCardBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "link_card", priority: CARD_BLOCK_PRIORITY });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const { title, titleNodes } = parseTitleInline(block.attrs, ctx);

    return {
      node: createNode(this.type, {
        title,
        titleNodes,
        link: pickAttr(block.attrs, "link") || pickAttr(block.attrs, "href"),
        children: ctx.parseBlocks(normalizeInnerLines(block.innerLines)),
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const link = String(node.link ?? "");
    const body = ctx.renderBlock(node.children ?? []);
    const href = link
      ? ` href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"`
      : "";

    const parts = [`<a class="card link-card"${href}>`];
    if (node.title) {
      parts.push(`<p class="card-title">${ctx.renderInline(node.titleNodes)}</p>`);
    }
    if (body) {
      parts.push(`<div class="card-body">${body}</div>`);
    }
    parts.push(`</a>`);
    return parts.join("\n");
  }
}

export const linkCardBlockParser = new LinkCardBlockParser();
