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
  collectEmphasisMatches,
  delimiterRunStart,
  literalOpenerPrefixLen,
  openConsumeStart,
  parseEmphasisAt,
  type ScannedPart,
} from "@/transformer/gfm/inline/emphasisProcess.js";

function canOpenEmphasis(
  src: string,
  index: number,
  parts: ScannedPart[],
): boolean {
  const marker = src[index];
  if (marker !== "*" && marker !== "_") return false;

  const runStart = delimiterRunStart(src, index);
  if (runStart === index) {
    const scanned = scanDelims(src, index, marker);
    if (scanned?.canOpen) return true;
  }

  const matches = collectEmphasisMatches(src, parts);
  return matches.some((m) => openConsumeStart(m, matches) === index);
}

class EmphasisInlineParser extends BaseInlineParser {
  constructor() {
    super("emphasis", false);
  }

  /** @inheritdoc */
  canOpenAt(src: string, index: number, ctx: InlineParseContext): boolean {
    const marker = src[index];
    if (marker !== "*" && marker !== "_") return false;

    const parts = ctx.getEmphasisLexParts(src);
    return canOpenEmphasis(src, index, parts);
  }

  /** @inheritdoc */
  parse(src: string, index: number, ctx: InlineParseContext) {
    const parts = ctx.getEmphasisLexParts(src);

    const prefixLen = literalOpenerPrefixLen(src, index, parts);
    if (prefixLen > 0) {
      return {
        node: createNode("text", prefixLen, src.slice(index, index + prefixLen)),
        nextIndex: index + prefixLen,
      };
    }

    if (!canOpenEmphasis(src, index, parts)) return null;

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
