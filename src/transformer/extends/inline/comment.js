/**
 * @file 行内注释语法
 * @module transformer/extends/inline/comment
 *
 * 语法：`%% ... %%`（Obsidian 风格，解析后不在 HTML 中渲染）
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

/** 行内注释定界符正则 */
const COMMENT_RE = /^%%([\s\S]*?)%%/;

/**
 * 行内注释解析器。
 *
 * @extends {BaseInlineParser}
 */
class InlineCommentParser extends BaseInlineParser {
  constructor() {
    super({ type: "inline_comment", priority: 52 });
  }

  /** @inheritdoc */
  parse(src, index) {
    if (src[index] !== "%" || src[index + 1] !== "%") return null;
    if (isEscaped(src, index)) return null;

    const match = src.slice(index).match(COMMENT_RE);
    if (!match) return null;

    return {
      node: createNode(this.type, { content: match[1] }),
      nextIndex: index + match[0].length,
    };
  }

  /** @inheritdoc */
  render() {
    return "";
  }
}

export default new InlineCommentParser();
