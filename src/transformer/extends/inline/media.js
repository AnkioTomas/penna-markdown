/**
 * 视频 / 音频：!video[alt](url) / !audio[alt](url)
 * 视频可选封面：!video[alt](url){poster=...}
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

const MEDIA_RE = /^!(video|audio)\[/;

const POSTER_RE = /^\{poster=([^}]+)\}/;

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
    const closer = src[j] === "(" ? ")" : src[j];
    let k = j + 1;
    while (k < src.length) {
      if (src[k] === "\\") k += 2;
      else if (src[k] === closer) {
        title = src.slice(j + 1, k);
        j = k + 1;
        break;
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

function renderAlt(nodes) {
  return nodes
    .map((n) => {
      if (n.type === "text") return n.value;
      if (n.children) return renderAlt(n.children);
      return "";
    })
    .join("");
}

class MediaInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "media", priority: 202 });
  }

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

    parsed.node.props.mediaType = mediaType;
    return parsed;
  }

  render(node, ctx) {
    const { mediaType, href, title, poster } = node.props;
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
