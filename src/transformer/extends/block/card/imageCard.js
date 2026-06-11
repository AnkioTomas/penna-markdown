/**
 * @file 块级语法拓展：图片卡片
 * @module transformer/extends/block/card/imageCard
 *
 * ```
 * ::: image-card image="..." title="..." href="/" author="..." date="2024/08/16"
 * 描述正文（可选，也可用 description 属性）
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

const OPEN_RE = /^ {0,3}:::(?!:)\s+image-card(?:\s+(.*))?\s*$/;

/**
 * @param {string} author
 * @param {string} date
 * @returns {string}
 */
function renderCopyright(author, date) {
  if (!author && !date) return "";

  const parts = [];
  if (author) parts.push(`<span>${escapeHtml(author)}</span>`);
  if (author && date) parts.push("<span> | </span>");
  if (date) parts.push(`<span>${escapeHtml(date)}</span>`);

  return `<p class="copyright">${parts.join("")}</p>`;
}

/**
 * @param {string} title
 * @param {string} href
 * @returns {string}
 */
function renderTitle(title, href) {
  if (!title) return "";
  if (href) {
    return `<h3 class="title"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>`;
  }
  return `<h3 class="title">${escapeHtml(title)}</h3>`;
}

/**
 * @param {string} descriptionAttr
 * @param {string} bodyHtml
 * @returns {string}
 */
function renderDescription(descriptionAttr, bodyHtml) {
  const body = bodyHtml.trim();
  if (body) {
    return `<div class="description">${body}</div>`;
  }
  if (descriptionAttr) {
    return `<p class="description">${escapeHtml(descriptionAttr)}</p>`;
  }
  return "";
}

class ImageCardBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "image_card", priority: CARD_BLOCK_PRIORITY });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    return {
      node: createNode(this.type, {
        title: pickAttr(block.attrs, "title"),
        link: pickAttr(block.attrs, "link") || pickAttr(block.attrs, "href"),
        image: pickAttr(block.attrs, "image"),
        description:
          pickAttr(block.attrs, "description") || pickAttr(block.attrs, "desc"),
        author: pickAttr(block.attrs, "author"),
        date: pickAttr(block.attrs, "date"),
        children: ctx.parseBlocks(normalizeInnerLines(block.innerLines)),
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const image = String(node.image ?? "");
    const title = String(node.title ?? "");
    const link = String(node.link ?? "");
    const author = String(node.author ?? "");
    const date = String(node.date ?? "");
    const description = String(node.description ?? "");
    const bodyHtml = ctx.renderBlock(node.children ?? []);

    const img = image
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">`
      : "";

    const infoParts = [
      renderTitle(title, link),
      renderCopyright(author, date),
      renderDescription(description, bodyHtml),
    ].filter(Boolean);

    return [
      `<div class="image-card">`,
      `<div class="image-container">`,
      img,
      infoParts.length ? `<div class="image-info">${infoParts.join("\n")}</div>` : "",
      `</div>`,
      `</div>`,
    ]
      .filter(Boolean)
      .join("\n");
  }
}

export const imageCardBlockParser = new ImageCardBlockParser();
