/**
 * 行内语法拓展：表情符号 :shortcode:
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";
import { resolveEmojiShortcode } from "@/transformer/extends/inline/emojiCatalog.js";

/** 字母/数字/下划线/连字符/加号，支持中文等 Unicode 短码名 */
const SHORTCODE_RE = /^:([\p{L}\p{N}_+-]+):/u;

class EmojiInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "emoji", priority: 46 });
  }

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

  render(node) {
    return node.props.emoji;
  }
}

export default new EmojiInlineParser();
