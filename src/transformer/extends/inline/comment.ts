/**
 * @file 行内注释语法
 * @module transformer/extends/inline/comment
 *
 * 语法：`%% ... %%`（Obsidian 风格，解析后不在 HTML 中渲染）
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import { isEscaped } from "@/transformer/utils/escape.js";

/**
 * 行内注释解析器。
 *
 * @extends {BaseInlineParser}
 */
class InlineCommentParser extends BaseInlineParser {
  constructor() {
    super("inline_comment");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    return src[index] === "%" && src[index + 1] === "%";
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    if (isEscaped(src, index)) return null;

    const startIndex = index + 2;
    let endIndex = -1;

    for (let i = startIndex; i < src.length - 1; i++) {
      if (src[i] === "%" && src[i + 1] === "%") {
        endIndex = i;
        break;
      }

      if (ctx.canStrongBreak(src, i, true)) return null;
    }

    if (endIndex === -1) return null;

    const content = src.substring(startIndex, endIndex);
    const closeIndex = endIndex + 2;
    const matchLength = closeIndex - index;

    return {
      node: createNode(this.type, matchLength, undefined, undefined, {
        content,
      }),
      nextIndex: closeIndex,
    };
  }

  /** @inheritdoc */
  render() {
    return "";
  }
}

export default new InlineCommentParser();
