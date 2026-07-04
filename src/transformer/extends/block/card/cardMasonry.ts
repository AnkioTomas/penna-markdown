/**
 * @file 块级语法拓展：卡片瀑布流
 * @module transformer/extends/block/card/cardMasonry
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  blockLength,
  pickAttr,
  readQuadColonBlock,
} from "./shared.js";

const OPEN_RE = /^ {0,3}::::(?!:)\s+card-masonry(?:\s+(.*))?\s*$/;

const DEFAULT_MASONRY_COLS = 3;
const DEFAULT_MASONRY_GAP = 16;
const MAX_MASONRY_COLS = 3;

function parseMasonryCols(raw: string, fallback = DEFAULT_MASONRY_COLS): number {
  const trimmed = String(raw ?? "").trim();
  if (!/^\d+$/.test(trimmed)) return fallback;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, MAX_MASONRY_COLS);
}

function parseMasonryGap(raw: string): number {
  const trimmed = String(raw ?? "").trim();
  if (!/^\d+$/.test(trimmed)) return DEFAULT_MASONRY_GAP;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_MASONRY_GAP;
}

function distributeMasonryItems(items: MarkdownNode[], cols: number) {
  const columns: Array<Array<{ index: number; node: MarkdownNode }>> = Array.from(
    { length: cols },
    () => [],
  );
  items.forEach((node, index) => {
    columns[index % cols].push({ index, node });
  });
  return columns;
}

class CardMasonryBlockParser extends BaseBlockParser {
  constructor() {
    super("card_masonry");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const block = readQuadColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const children = ctx.parseBlocks(normalizeInnerLines(block.innerLines));
    if (children.length === 0) return null;

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        children,
        {
          cols: parseMasonryCols(pickAttr(block.attrs, "cols")),
          gap: parseMasonryGap(pickAttr(block.attrs, "gap")),
        },
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const cols = Number(node.props?.cols ?? DEFAULT_MASONRY_COLS);
    const gap = Number(node.props?.gap ?? DEFAULT_MASONRY_GAP);
    const children = node.children ?? [];
    const total = children.length;
    const columns = distributeMasonryItems(children, cols);

    const columnHtml = columns
      .map((items) => {
        const itemHtml = items
          .map(({ index, node: child }) => {
            const html = ctx.renderBlock([child]);
            return `<div class="cherry-card-masonry__v-${total}-${index}">${html}</div>`;
          })
          .join("\n");

        return `<div class="cherry-card-masonry__item" style="gap: ${gap}px;">\n${itemHtml}\n</div>`;
      })
      .join("\n");

    return `<div class="cherry-card-masonry cherry-card-masonry--cols-${cols}" style="gap: ${gap}px; --card-masonry-cols: ${cols};"${this.sourceLineAttrs(node)}>\n${columnHtml}\n</div>`;
  }
}

export const cardMasonryBlockParser = new CardMasonryBlockParser();
