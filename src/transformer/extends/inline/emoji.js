/**
 * @file 行内 Emoji 短码语法
 * @module transformer/extends/inline/emoji
 *
 * 语法：`:shortcode:`，短码名映射见 emojiCatalog.js
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import { resolveEmojiShortcode } from "@/transformer/extends/inline/emojiCatalog.js";

/** 短码名正则：字母/数字/下划线/连字符/加号，支持中文等 Unicode */
const SHORTCODE_RE = /^:([\p{L}\p{N}_+-]+):/u;

/**
 * 行内 Emoji 短码解析器。
 *
 * @extends {BaseInlineParser}
 */
class EmojiInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "emoji", priority: 46 });
  }

  /** @inheritdoc */
  parse(src, index) {
    if (src[index] !== ":" || isEscaped(src, index)) return null;

    const match = src.slice(index).match(SHORTCODE_RE);
    if (!match) return null;

    const emoji = resolveEmojiShortcode(match[1]);
    if (!emoji) return null;

    return {
      node: createNode(this.type, {
        shortcode: match[1],
        emoji,
      }),
      nextIndex: index + match[0].length,
    };
  }

  /** @inheritdoc */
  render(node) {
    return node.emoji;
  }
}

export default new EmojiInlineParser();
