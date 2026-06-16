/**
 * @file 行内 Emoji 短码语法
 * @module transformer/extends/inline/emoji
 *
 * 语法：`:shortcode:`，短码名映射见 emoji/full.ts
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
import {isEscaped} from "@/transformer/gfm/inline/shared.js";
import emojiFull from "@/transformer/extends/inline/emoji/full.js";
import {InlineParseContext} from "@/transformer/core/context/InlineParseContext";
import {RenderContext} from "@/transformer/core/context/RenderContext";

/** 短码名正则：字母/数字/下划线/连字符/加号，支持中文等 Unicode */
const SHORTCODE_RE = /^:([\p{L}\p{N}_+-]+):/u;

/**
 * 将短码名解析为 emoji 字符。
 *
 * @param {string} raw - 冒号之间的短码名
 * @returns {string | null} 对应 emoji，未命中时返回 null
 */
function resolveEmojiShortcode(raw: string): string | null {
  const key = raw.trim();
  if (!key) return null;
  return emojiFull[key] ?? emojiFull[key.toLowerCase()] ?? null;
}

/**
 * 行内 Emoji 短码解析器。
 *
 * @extends {BaseInlineParser}
 */
class EmojiInlineParser extends BaseInlineParser {
  constructor() {
    super("emoji");
  }

  canOpenAt(src: string, index: number, ctx: InlineParseContext) {
    return !(src[index] !== ":" || isEscaped(src, index));

  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    const match = src.slice(index).match(SHORTCODE_RE);
    if (!match) return null;

    const emoji = resolveEmojiShortcode(match[1]);
    if (!emoji) return null;

    return {
      node: createNode(this.type, match[0].length, emoji),
      nextIndex: index + match[0].length,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    return node.value ?? "";
  }
}

export default new EmojiInlineParser();