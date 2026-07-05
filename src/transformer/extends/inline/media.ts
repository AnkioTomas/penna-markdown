/**
 * @file 媒体语法（行内 video/audio + 块级 video/audio/iframe）
 * @module transformer/extends/inline/media
 *
 * 语法：
 * - 行内：`!video[alt](url)` / `!audio[alt](url)`，可选 `{poster=url}`
 * - 块级：独立行的 `!video[...]` / `!audio[...]` / `!iframe[...]`
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { escapeHtml, isEscaped } from "@/transformer/utils/escape.js";
import {
  normalizeLinkDestination,
  parseInlineLinkParen,
} from "@/transformer/utils/linkDestination.js";
import { findLinkTextEnd } from "@/transformer/utils/linkLabel.js";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";

type MediaType = "video" | "audio" | "iframe";

interface MediaParseContext {
  parseInline(text: string): MarkdownNode[];
}

const POSTER_RE = /^\{poster=([^}]+)\}/;
const MEDIA_LINE_RE = /^ {0,3}!(video|audio)\[/;
const IFRAME_LINE_RE = /^ {0,3}!iframe\[/;

interface MediaProps {
  mediaType: MediaType;
  href: string;
  title: string;
  poster: string;
}

function isAllowedMediaUrl(url: string): boolean {
  return /^https?:\/\//i.test(String(url ?? "").trim());
}

function isAllowedIframeUrl(url: string): boolean {
  return isAllowedMediaUrl(url);
}

function readPoster(src: string, start: number): { poster: string; nextIndex: number } {
  const match = src.slice(start).match(POSTER_RE);
  if (!match) return { poster: "", nextIndex: start };
  return {
    poster: normalizeLinkDestination(match[1].trim()),
    nextIndex: start + match[0].length,
  };
}

function parseMediaTag(
  src: string,
  index: number,
  ctx: MediaParseContext,
  allowed: MediaType[],
): { node: MarkdownNode; nextIndex: number } | null {
  if (src[index] !== "!" || isEscaped(src, index)) return null;

  let mediaType: MediaType | null = null;
  let labelStart = -1;

  if (allowed.includes("video") && src.startsWith("!video[", index)) {
    mediaType = "video";
    labelStart = index + "!video[".length;
  } else if (allowed.includes("audio") && src.startsWith("!audio[", index)) {
    mediaType = "audio";
    labelStart = index + "!audio[".length;
  } else if (allowed.includes("iframe") && src.startsWith("!iframe[", index)) {
    mediaType = "iframe";
    labelStart = index + "!iframe[".length;
  }

  if (!mediaType || labelStart < 0) return null;

  const labelEnd = findLinkTextEnd(src, labelStart);
  if (labelEnd === -1) return null;

  const altText = src.slice(labelStart, labelEnd);
  const parenIndex = labelEnd + 1;
  if (src[parenIndex] !== "(") return null;

  const link = parseInlineLinkParen(src, parenIndex);
  if (!link) return null;

  const posterParsed = readPoster(src, link.next);
  if (mediaType === "iframe" && !isAllowedIframeUrl(link.href)) return null;
  if (mediaType !== "iframe" && !isAllowedMediaUrl(link.href)) return null;
  if (posterParsed.poster && !isAllowedMediaUrl(posterParsed.poster)) {
    posterParsed.poster = "";
  }

  const children = ctx.parseInline(altText);
  const nextIndex = posterParsed.nextIndex;

  return {
    node: createNode("media", nextIndex - index, undefined, children, {
      mediaType,
      href: link.href,
      title: link.title,
      poster: posterParsed.poster,
    } satisfies MediaProps),
    nextIndex,
  };
}

function renderAltText(nodes: MarkdownNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.value ?? "";
      if (node.children) return renderAltText(node.children);
      return "";
    })
    .join("");
}

function mediaProps(node: MarkdownNode): MediaProps {
  const props = node.props ?? {};
  return {
    mediaType: (props.mediaType as MediaType) ?? "video",
    href: String(props.href ?? ""),
    title: String(props.title ?? ""),
    poster: String(props.poster ?? ""),
  };
}

function renderMediaHtml(
  node: MarkdownNode,
  sourceLineAttrs: string,
  options: { block?: boolean } = {},
): string {
  const lineAttrs = sourceLineAttrs;
  const { mediaType, href, title, poster } = mediaProps(node);
  const alt = renderAltText(node.children ?? []);
  const src = escapeHtml(href);
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

    return `<figure class="cherry-media cherry-video"${lineAttrs}>${player}${caption}</figure>`;
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
    ? `<img class="cherry-audio-player__cover-img" src="${escapeHtml(poster)}" alt="" loading="lazy" />`
    : "";

  return [
    `<figure class="cherry-media cherry-audio"${lineAttrs}>`,
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

function renderIframeHtml(node: MarkdownNode, sourceLineAttrs: string): string {
  const { href, title } = mediaProps(node);
  const alt = renderAltText(node.children ?? []);
  const src = escapeHtml(href);
  const iframeTitle = title
    ? escapeHtml(title)
    : alt.trim()
      ? escapeHtml(alt)
      : "";
  const titleAttr = iframeTitle ? ` title="${iframeTitle}"` : "";

  const frame = [
    `<div class="cherry-iframe__frame">`,
    `<iframe src="${src}"${titleAttr} loading="lazy" allowfullscreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>`,
    `</div>`,
  ].join("");

  const caption = alt.trim()
    ? `<figcaption class="cherry-media__caption">${escapeHtml(alt)}</figcaption>`
    : "";

  return `<figure class="cherry-media cherry-iframe"${sourceLineAttrs}>${frame}${caption}</figure>`;
}

/** 行内 video / audio 解析器 */
class MediaInlineParser extends BaseInlineParser {
  constructor() {
    super("media");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    if (src[index] !== "!" || isEscaped(src, index)) return false;
    return src.startsWith("!video[", index) || src.startsWith("!audio[", index);
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    return parseMediaTag(src, index, ctx, ["video", "audio"]);
  }

  /** @inheritdoc */
  render(node: MarkdownNode, _ctx: RenderContext) {
    return renderMediaHtml(node, "", { block: false });
  }
}

/** 块级 video / audio 解析器 */
class MediaBlockParser extends BaseBlockParser {
  constructor() {
    super("media_embed");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return MEDIA_LINE_RE.test(lines[index] ?? "");
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    if (!MEDIA_LINE_RE.test(line)) return null;

    const content = line.slice(skipBlockPrefixSpaces(line));
    const parsed = parseMediaTag(content, 0, ctx, ["video", "audio"]);
    if (!parsed || parsed.nextIndex !== content.length) return null;

    const { mediaType, href, title, poster } = mediaProps(parsed.node);

    return {
      node: createNode("media_embed", 1, undefined, parsed.node.children, {
        mediaType,
        href,
        title,
        poster,
      }),
      nextIndex: index + 1,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    return renderMediaHtml(node, this.sourceLineAttrs(node), { block: true });
  }
}

/** 块级 iframe 解析器 */
class IframeBlockParser extends BaseBlockParser {
  constructor() {
    super("iframe_embed");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return IFRAME_LINE_RE.test(lines[index] ?? "");
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    if (!IFRAME_LINE_RE.test(line)) return null;

    const content = line.slice(skipBlockPrefixSpaces(line));
    const parsed = parseMediaTag(content, 0, ctx, ["iframe"]);
    if (!parsed || parsed.nextIndex !== content.length) return null;

    const { href, title } = mediaProps(parsed.node);

    return {
      node: createNode("iframe_embed", 1, undefined, parsed.node.children, {
        href,
        title,
        mediaType: "iframe",
        poster: "",
      }),
      nextIndex: index + 1,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    return renderIframeHtml(node, this.sourceLineAttrs(node));
  }
}

export const mediaInlineParser = new MediaInlineParser();
export const mediaBlockParser = new MediaBlockParser();
export const iframeBlockParser = new IframeBlockParser();

export default mediaInlineParser;
