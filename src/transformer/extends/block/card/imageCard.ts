/**
 * @file 块级语法拓展：图片卡片
 * @module transformer/extends/block/card/imageCard
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  blockLength,
  parseTitleInline,
  pickAttr,
  readTripleColonBlock,
} from "./shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+image-card(?:\s+(.*))?\s*$/;

function renderCopyright(author: string, date: string): string {
  if (!author && !date) return "";

  const parts: string[] = [];
  if (author) parts.push(`<span>${escapeHtml(author)}</span>`);
  if (author && date) parts.push("<span> | </span>");
  if (date) parts.push(`<span>${escapeHtml(date)}</span>`);

  return `<p class="cherry-image-card__copyright">${parts.join("")}</p>`;
}

function renderTitle(titleNodes: MarkdownNode[], href: string, ctx: RenderContext): string {
  if (!titleNodes?.length) return "";
  const html = ctx.renderInline(titleNodes);
  if (href) {
    return `<h3 class="cherry-image-card__title"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${html}</a></h3>`;
  }
  return `<h3 class="cherry-image-card__title">${html}</h3>`;
}

function renderDescription(descriptionAttr: string, bodyHtml: string): string {
  const body = bodyHtml.trim();
  if (body) {
    return `<div class="cherry-image-card__description">${body}</div>`;
  }
  if (descriptionAttr) {
    return `<p class="cherry-image-card__description">${escapeHtml(descriptionAttr)}</p>`;
  }
  return "";
}

class ImageCardBlockParser extends BaseBlockParser {
  constructor() {
    super("image_card");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const { title, titleNodes } = parseTitleInline(block.attrs, ctx);
    const children = ctx.parseBlocks(normalizeInnerLines(block.innerLines));

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        children,
        {
          title,
          titleNodes,
          link: pickAttr(block.attrs, "link") || pickAttr(block.attrs, "href"),
          image: pickAttr(block.attrs, "image"),
          description:
            pickAttr(block.attrs, "description") || pickAttr(block.attrs, "desc"),
          author: pickAttr(block.attrs, "author"),
          date: pickAttr(block.attrs, "date"),
        },
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const image = String(node.props?.image ?? "");
    const title = String(node.props?.title ?? "");
    const titleNodes = (node.props?.titleNodes as MarkdownNode[] | undefined) ?? [];
    const link = String(node.props?.link ?? "");
    const author = String(node.props?.author ?? "");
    const date = String(node.props?.date ?? "");
    const description = String(node.props?.description ?? "");
    const bodyHtml = ctx.renderBlock(node.children ?? []);

    const img = image
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">`
      : "";

    const infoParts = [
      renderTitle(titleNodes, link, ctx),
      renderCopyright(author, date),
      renderDescription(description, bodyHtml),
    ].filter(Boolean);

    return [
      `<div class="cherry-image-card">`,
      `<div class="cherry-image-card__media">`,
      img,
      infoParts.length ? `<div class="cherry-image-card__info">${infoParts.join("\n")}</div>` : "",
      `</div>`,
      `</div>`,
    ]
      .filter(Boolean)
      .join("\n");
  }
}

export const imageCardBlockParser = new ImageCardBlockParser();
