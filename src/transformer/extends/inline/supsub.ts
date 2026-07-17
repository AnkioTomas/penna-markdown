/**
 * @file 行内上标 / 下标语法
 * @module transformer/extends/inline/supsub
 *
 * 语法：`~下标~` / `^上标^`（Penna 扩展语法）
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { isEscaped } from "@/transformer/utils/escape.js";

interface DelimitedMatch {
  inner: string;
  closeIndex: number;
}

function parseDelimited(
  src: string,
  index: number,
  ctx: InlineParseContext,
  delimiter: string,
): DelimitedMatch | null {
  if (src[index] !== delimiter) return null;
  if (isEscaped(src, index)) return null;

  const startIndex = index + 1;
  let endIndex = -1;

  for (let i = startIndex; i < src.length; i++) {
    if (src[i] === delimiter) {
      endIndex = i;
      break;
    }

    if (ctx.canStrongBreak(src, i, true)) return null;
  }

  if (endIndex === -1) return null;

  const inner = src.substring(startIndex, endIndex);
  if (inner.length === 0) return null;

  return { inner, closeIndex: endIndex + 1 };
}

/**
 * 下标行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class SubInlineParser extends BaseInlineParser {
  constructor() {
    super("sub");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    return src[index] === "~";
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    const matched = parseDelimited(src, index, ctx, "~");
    if (!matched) return null;

    const matchLength = matched.closeIndex - index;

    return {
      node: createNode(
        this.type,
        matchLength,
        undefined,
        ctx.parseInline(matched.inner),
      ),
      nextIndex: matched.closeIndex,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    return `<sub>${ctx.renderInline(node.children ?? [])}</sub>`;
  }
}

/**
 * 上标行内解析器。
 *
 * @extends {BaseInlineParser}
 */
class SupInlineParser extends BaseInlineParser {
  constructor() {
    super("sup");
  }

  canOpenAt(src: string, index: number, _ctx: InlineParseContext): boolean {
    return src[index] === "^";
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    const matched = parseDelimited(src, index, ctx, "^");
    if (!matched) return null;

    const matchLength = matched.closeIndex - index;

    return {
      node: createNode(
        this.type,
        matchLength,
        undefined,
        ctx.parseInline(matched.inner),
      ),
      nextIndex: matched.closeIndex,
    };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    return `<sup>${ctx.renderInline(node.children ?? [])}</sup>`;
  }
}

export const subInlineParser = new SubInlineParser();
export const supInlineParser = new SupInlineParser();
export default subInlineParser;
