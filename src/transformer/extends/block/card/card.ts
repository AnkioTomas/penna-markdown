/**
 * @file 块级语法拓展：基础卡片
 * @module transformer/extends/block/card/card
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import {
  createNode,
  type MarkdownNode,
} from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import { blockLength, readTripleColonBlock } from "./shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+card(?:\s+(.*))?\s*$/;

class CardBlockParser extends BaseBlockParser {
  constructor() {
    super("card");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const title = (block.attrs ?? "").trim();
    const titleNodes = title ? ctx.parseInline(title) : [];
    const children = ctx.parseBlocks(normalizeInnerLines(block.innerLines));

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        children,
        { title, titleNodes },
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const title = String(node.props?.title ?? "");
    const titleNodes =
      (node.props?.titleNodes as MarkdownNode[] | undefined) ?? [];
    const body = ctx.renderBlock(node.children ?? []);

    const parts = [`<div class="cherry-card"${this.sourceLineAttrs(node)}>`];
    if (title) {
      parts.push(
        `<p class="cherry-card__title">${ctx.renderInline(titleNodes)}</p>`,
      );
    }
    if (body) {
      parts.push(`<div class="cherry-card__body">${body}</div>`);
    }
    parts.push(`</div>`);
    return parts.join("\n");
  }
}

export const cardBlockParser = new CardBlockParser();
export default cardBlockParser;
