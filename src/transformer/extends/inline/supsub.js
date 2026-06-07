/**
 * @file 行内上标 / 下标语法
 * @module transformer/extends/inline/supsub
 *
 * 语法：`^^下标^^` / `^上标^`（Cherry 扩展语法）
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

/** 下标定界符正则：`^^...^^` */
const SUB_RE = /^\^\^([\s\S]+?)\^\^/;

/** 上标定界符正则：`^...^`（单 caret） */
const SUP_RE = /^\^([\s\S]+?)\^/;

/**
 * 下标行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class SubInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "sub", priority: 52 });
  }

  /** @inheritdoc */
  parse(src, index, ctx) {
    if (src[index] !== "^" || src[index + 1] !== "^") return null;
    if (isEscaped(src, index)) return null;

    const match = src.slice(index).match(SUB_RE);
    if (!match) return null;

    return {
      node: createNode(this.type, {
        children: ctx.parseInline(match[1]),
      }),
      nextIndex: index + match[0].length,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    return `<sub>${ctx.renderInline(node.children)}</sub>`;
  }
}

/**
 * 上标行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class SupInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "sup", priority: 51 });
  }

  /** @inheritdoc */
  parse(src, index, ctx) {
    if (src[index] !== "^") return null;
    if (src[index + 1] === "^") return null;
    if (isEscaped(src, index)) return null;

    const match = src.slice(index).match(SUP_RE);
    if (!match) return null;

    return {
      node: createNode(this.type, {
        children: ctx.parseInline(match[1]),
      }),
      nextIndex: index + match[0].length,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    return `<sup>${ctx.renderInline(node.children)}</sup>`;
  }
}

export const subInlineParser = new SubInlineParser();
export const supInlineParser = new SupInlineParser();
export default subInlineParser;
