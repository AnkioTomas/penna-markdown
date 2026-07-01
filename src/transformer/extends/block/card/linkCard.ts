/**
 * @file 块级语法拓展：链接卡片
 * @module transformer/extends/block/card/linkCard
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  blockLength,
  parseLinkCardOpen,
  readTripleColonBlock,
} from "./shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+link-card(?:\s+(.*))?\s*$/;

class LinkCardBlockParser extends BaseBlockParser {
  constructor() {
    super("link_card");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const { title, titleNodes, link, icon } = parseLinkCardOpen(block.attrs, ctx);
    const children = ctx.parseBlocks(normalizeInnerLines(block.innerLines));

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        children,
        { title, titleNodes, link, icon },
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const link = String(node.props?.link ?? "");
    const icon = String(node.props?.icon ?? "");
    const title = String(node.props?.title ?? "");
    const titleNodes = (node.props?.titleNodes as MarkdownNode[] | undefined) ?? [];
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

    if (title) {
      parts.push(
        `<p class="cherry-card__title">${ctx.renderInline(titleNodes)}</p>`,
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
