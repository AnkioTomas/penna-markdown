/**
 * @file 块级语法拓展：链接卡片
 * @module transformer/extends/block/card/linkCard
 *
 * ```
 * ::: link-card 文档 link="https://example.com"
 * ::: link-card 文档 link="https://example.com" icon="https://example.com/icon.png"
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
  parseLinkCardOpen,
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

    const { title, titleNodes, link, icon } = parseLinkCardOpen(block.attrs, ctx);

    return {
      node: createNode(this.type, {
        title,
        titleNodes,
        link,
        icon,
        children: ctx.parseBlocks(normalizeInnerLines(block.innerLines)),
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const link = String(node.link ?? "");
    const icon = String(node.icon ?? "");
    const body = ctx.renderBlock(node.children ?? []);
    const href = link
      ? ` href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"`
      : "";

    const cardClasses = [
      "cherry-card",
      "cherry-link-card",
      icon ? "cherry-link-card--has-icon" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const parts = [`<a class="${cardClasses}"${href}>`];

    if (icon) {
      parts.push(
        `<img class="cherry-link-card__icon" src="${escapeHtml(icon)}" alt="" loading="lazy">`,
        `<div class="cherry-link-card__main">`,
      );
    }

    if (node.title) {
      parts.push(
        `<p class="cherry-card__title">${ctx.renderInline(node.titleNodes)}</p>`,
      );
    }
    if (body) {
      parts.push(`<div class="cherry-card__body">${body}</div>`);
    }

    if (icon) {
      parts.push(`</div>`);
    }

    parts.push(`</a>`);
    return parts.join("\n");
  }
}

export const linkCardBlockParser = new LinkCardBlockParser();
