/**
 * @file 行内视频 / 音频语法
 * @module transformer/extends/inline/media
 *
 * 语法：`!video[alt](url)` / `!audio[alt](url)`
 *
 * 视频可选封面：`!video[alt](url){poster=...}`
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import {
  findLinkTextEnd,
  normalizeLinkDestination,
  normalizeLinkTitle,
  parseAngleDestination,
  parsePlainDestination,
} from "@/transformer/gfm/inline/shared.js";

/** 媒体标签前缀正则：`!video[` 或 `!audio[` */
const MEDIA_RE = /^!(video|audio)\[/;

/** 视频 poster 属性后缀正则：`{poster=url}` */
const POSTER_RE = /^\{poster=([^}]+)\}/;

/**
 * 解析媒体链接的目标 URL、标题及可选 poster。
 *
 * @param {string} src - 完整源字符串
 * @param {number} start - `(` 起始索引
 * @param {string} altText - 方括号内的 alt 文本
 * @param {import('@/transformer/core/ParserContext.js').InlineParseContext} ctx
 * @returns {{ node: import('@/transformer/core/MarkdownNode.js').MarkdownNode, nextIndex: number } | null}
 */
function parseMediaDestination(src, start, altText, ctx) {
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
 * 从 AST 子节点提取纯文本 alt 内容（用于 video/audio 标签内回退文本）。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes
 * @returns {string}
 */
function renderAlt(nodes) {
  return nodes
    .map((n) => {
      if (n.type === "text") return n.value;
      if (n.children) return renderAlt(n.children);
      return "";
    })
    .join("");
}

/**
 * 视频 / 音频行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class MediaInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "media", priority: 202 });
  }

  /** @inheritdoc */
  parse(src, index, ctx) {
    if (src[index] !== "!" || isEscaped(src, index)) return null;

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

  /** @inheritdoc */
  render(node, ctx) {
    const { mediaType, href, title, poster } = node;
    const alt = escapeHtml(renderAlt(node.children));
    const src = escapeHtml(href ?? "");
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";

    if (mediaType === "video") {
      const posterAttr = poster ? ` poster="${escapeHtml(poster)}"` : "";
      return `<video src="${src}"${titleAttr}${posterAttr} controls="controls">${alt}</video>`;
    }

    return `<audio src="${src}"${titleAttr} controls="controls">${alt}</audio>`;
  }
}

export default new MediaInlineParser();
