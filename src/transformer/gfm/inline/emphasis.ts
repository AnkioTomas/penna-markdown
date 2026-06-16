/**
 * @file 行内语法：斜体 / 加粗定界符
 * @module transformer/gfm/inline/emphasis
 *
 * 解析由 emphasisProcess 定界符栈完成；strong 仅注册渲染器。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { InlineParseContext } from "@/transformer/core/context/InlineParseContext.js";
import { scanDelims } from "@/transformer/utils/flanking.js";
import {
  parseEmphasisAt,
  type ScannedPart,
} from "@/transformer/gfm/inline/emphasisProcess.js";

function buildLexParts(src: string, ctx: InlineParseContext): ScannedPart[] {
  const parts: ScannedPart[] = [];
  let index = 0;

  while (index < src.length) {
    const skipped = ctx.parseInlineAt(src, index, true);
    if (skipped) {
      parts.push({
        start: index,
        end: skipped.nextIndex,
        node: skipped.node,
      });
      index = skipped.nextIndex;
      continue;
    }

    let end = index + 1;
    while (end < src.length && !ctx.parseInlineAt(src, end, true)) {
      end += 1;
    }
    parts.push({
      start: index,
      end,
      node: createNode("text", end - index, src.slice(index, end)),
    });
    index = end;
  }

  return parts;
}

class EmphasisInlineParser extends BaseInlineParser {
  constructor() {
    super("emphasis", false);
  }

  /** @inheritdoc */
  canOpenAt(src: string, index: number): boolean {
    const marker = src[index];
    if (marker !== "*" && marker !== "_") return false;
    if (index > 0 && src[index - 1] === marker) return false;

    const scanned = scanDelims(src, index, marker);
    return scanned?.canOpen ?? false;
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    if (!this.canOpenAt(src, index, ctx)) return null;

    const parts = buildLexParts(src, ctx);
    const matched = parseEmphasisAt(src, index, parts, (text) =>
      ctx.parseInline(text),
    );
    if (!matched) return null;

    return { node: matched.node, nextIndex: matched.nextIndex };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: { renderInline(nodes?: MarkdownNode[]): string }) {
    return `<em>${ctx.renderInline(node.children)}</em>`;
  }
}

export default new EmphasisInlineParser();
