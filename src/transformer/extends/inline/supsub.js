/**
 * 角标：^^下标^^ / ^上标^（Cherry 语法）
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isEscaped } from "@/transformer/gfm/inline/shared.js";

const SUB_RE = /^\^\^([\s\S]+?)\^\^/;
const SUP_RE = /^\^([\s\S]+?)\^/;

class SubInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "sub", priority: 52 });
  }

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

  render(node, ctx) {
    return `<sub>${ctx.renderInline(node.children)}</sub>`;
  }
}

class SupInlineParser extends BaseInlineParser {
  constructor() {
    super({ type: "sup", priority: 51 });
  }

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

  render(node, ctx) {
    return `<sup>${ctx.renderInline(node.children)}</sup>`;
  }
}

export const subInlineParser = new SubInlineParser();
export const supInlineParser = new SupInlineParser();
export default subInlineParser;
