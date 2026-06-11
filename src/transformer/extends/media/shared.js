/**
 * @file 媒体语法共享解析与渲染
 * @module transformer/extends/media/shared
 */

import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import {
  findLinkTextEnd,
  normalizeLinkDestination,
  normalizeLinkTitle,
  parseAngleDestination,
  parsePlainDestination,
} from "@/transformer/gfm/inline/shared.js";

/** 媒体标签前缀正则：`!video[` 或 `!audio[` */
export const MEDIA_RE = /^!(video|audio)\[/;

/** 媒体封面属性后缀正则：`{poster=url}` */
const POSTER_RE = /^\{poster=([^}]+)\}/;

/**
 * @param {string} src
 * @param {number} start
 * @param {string} altText
 * @param {import('@/transformer/core/ParserContext.js').InlineParseContext} ctx
 */
export function parseMediaDestination(src, start, altText, ctx) {
  let j = start + 1;
  while (j < src.length && /[ \t\r\n\v\f]/.test(src[j])) j++;

  let href = "";
  if (src[j] === "<") {
    const dest = parseAngleDestination(src, j);
    if (!dest) return null;
    href = dest.href;
    j = dest.next;
  } else {
    const dest = parsePlainDestination(src, j);
    href = dest.href;
    j = dest.next;
  }

  while (j < src.length && /[ \t\r\n\v\f]/.test(src[j])) j++;

  let title = "";
  if (src[j] === '"' || src[j] === "'" || src[j] === "(") {
    const closer = src[j];
    let k = j + 1;
    let parenLevel = src[j] === "(" ? 1 : 0;
    while (k < src.length) {
      if (src[k] === "\\") k += 2;
      else if (src[k] === closer && parenLevel === 0) {
        title = src.slice(j + 1, k);
        j = k + 1;
        break;
      } else if (src[k] === "(" && closer === "(") {
        parenLevel++;
      } else if (src[k] === ")" && closer === ")") {
        parenLevel--;
        if (parenLevel < 0) parenLevel = 0;
      } else k++;
    }
  }

  while (j < src.length && /[ \t\r\n\v\f]/.test(src[j])) j++;
  if (src[j] !== ")") return null;

  let nextIndex = j + 1;
  let poster = "";

  const tail = src.slice(nextIndex);
  const posterMatch = tail.match(POSTER_RE);
  if (posterMatch) {
    poster = posterMatch[1].trim();
    nextIndex += posterMatch[0].length;
  }

  return {
    node: createNode("media", {
      href: normalizeLinkDestination(href),
      title: normalizeLinkTitle(title),
      poster: poster ? normalizeLinkDestination(poster) : "",
      children: ctx.parseInline(altText),
    }),
    nextIndex,
  };
}

/**
 * @param {string} src
 * @param {number} index
 * @param {import('@/transformer/core/ParserContext.js').InlineParseContext} ctx
 */
export function parseMediaSource(src, index, ctx) {
  const tagMatch = src.slice(index).match(MEDIA_RE);
  if (!tagMatch) return null;

  const mediaType = tagMatch[1];
  const labelStart = index + tagMatch[0].length;
  const labelEnd = findLinkTextEnd(src, labelStart);
  if (labelEnd === -1) return null;

  const alt = src.slice(labelStart, labelEnd);
  const nextIndex = labelEnd + 1;
  if (src[nextIndex] !== "(") return null;

  const parsed = parseMediaDestination(src, nextIndex, alt, ctx);
  if (!parsed) return null;

  parsed.node.mediaType = mediaType;
  return parsed;
}

/**
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes
 * @returns {string}
 */
export function renderAltText(nodes) {
  return nodes
    .map((n) => {
      if (n.type === "text") return n.value;
      if (n.children) return renderAltText(n.children);
      return "";
    })
    .join("");
}

/**
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} node
 * @param {import('@/transformer/core/ParserContext.js').RenderContext} ctx
 * @param {{ block?: boolean }} [options]
 */
export function renderMediaHtml(node, ctx, options = {}) {
  const { mediaType, href, title, poster } = node;
  const alt = renderAltText(node.children ?? []);
  const src = escapeHtml(href ?? "");
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
  const block = options.block !== false;

  if (mediaType === "video") {
    const posterAttr = poster ? ` poster="${escapeHtml(poster)}"` : "";
    const player = `<video class="cherry-media__player" src="${src}"${titleAttr}${posterAttr} controls playsinline preload="metadata"></video>`;

    if (!block) {
      return `<video class="cherry-media__player cherry-media__player--inline" src="${src}"${titleAttr}${posterAttr} controls playsinline preload="metadata"></video>`;
    }

    const caption = alt.trim()
      ? `<figcaption class="cherry-media__caption">${escapeHtml(alt)}</figcaption>`
      : "";

    return `<figure class="cherry-media cherry-video">${player}${caption}</figure>`;
  }

  const audio = `<audio class="cherry-audio-player__track" src="${src}"${titleAttr} controls preload="metadata"></audio>`;

  if (!block) {
    return `<audio class="cherry-media__player cherry-media__player--inline" src="${src}"${titleAttr} controls preload="metadata"></audio>`;
  }

  const label = alt.trim() ? escapeHtml(alt) : "音频";
  const coverClass = poster
    ? "cherry-audio-player__cover cherry-audio-player__cover--image"
    : "cherry-audio-player__cover";
  const coverHtml = poster
    ? `<img class="cherry-audio-player__cover-img" src="${escapeHtml(poster)}" alt="" />`
    : "";

  return [
    `<figure class="cherry-media cherry-audio">`,
    `<div class="cherry-audio-player">`,
    `<div class="${coverClass}" aria-hidden="true">${coverHtml}</div>`,
    `<div class="cherry-audio-player__main">`,
    `<p class="cherry-audio-player__title">${label}</p>`,
    audio,
    `</div>`,
    `</div>`,
    `</figure>`,
  ].join("");
}
