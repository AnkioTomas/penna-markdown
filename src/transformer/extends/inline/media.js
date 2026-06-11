/**
 * @file 行内视频 / 音频语法（段落内嵌）
 * @module transformer/extends/inline/media
 *
 * 可选封面：`{poster=url}`
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import {
  MEDIA_RE,
  parseMediaSource,
  renderMediaHtml,
} from "@/transformer/extends/media/shared.js";

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
    if (!MEDIA_RE.test(src.slice(index))) return null;
    return parseMediaSource(src, index, ctx);
  }

  /** @inheritdoc */
  render(node, ctx) {
    return renderMediaHtml(node, ctx, { block: false });
  }
}

export default new MediaInlineParser();
