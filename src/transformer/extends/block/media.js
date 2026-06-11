/**
 * @file 块级语法拓展：视频 / 音频嵌入
 * @module transformer/extends/block/media
 *
 * 语法：`!video[alt](url)` / `!audio[alt](url)`
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import {
  parseMediaSource,
  renderMediaHtml,
} from "@/transformer/extends/media/shared.js";

/** 块级媒体行：`!video[` / `!audio[` */
const MEDIA_LINE_RE = /^ {0,3}!(video|audio)\[/;

/**
 * 视频 / 音频块解析器。
 *
 * @extends {BaseBlockParser}
 */
class MediaBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "media_embed", priority: 87 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    if (!MEDIA_LINE_RE.test(line)) return null;

    const content = line.replace(/^ {0,3}/, "");
    const parsed = parseMediaSource(content, 0, ctx);
    if (!parsed || parsed.nextIndex !== content.length) return null;

    const { mediaType, href, title, poster, children } = parsed.node;
    const node = createNode("media_embed", {
      mediaType,
      href,
      title,
      poster,
      children,
    });

    return { node, nextIndex: index + 1 };
  }

  /** @inheritdoc */
  render(node, ctx) {
    return renderMediaHtml(node, ctx, { block: true });
  }
}

export default new MediaBlockParser();
