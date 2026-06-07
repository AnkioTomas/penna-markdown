/**
 * 行内注释：%% ... %%（Obsidian 风格，不渲染）
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

const COMMENT_RE = /^%%([\s\S]*?)%%/;

class InlineCommentParser extends BaseInlineParser {
  constructor() {
    super({ type: "inline_comment", priority: 52 });
  }

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

  render() {
    return "";
  }
}

export default new InlineCommentParser();
