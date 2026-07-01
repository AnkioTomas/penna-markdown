/**
 * @file 块级语法拓展：卡片网格
 * @module transformer/extends/block/card/cardGrid
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

const OPEN_RE = /^ {0,3}::::(?!:)\s+card-grid(?:\s+(.*))?\s*$/;

const DEFAULT_GRID_COLS = { sm: 1, md: 2, lg: 2 };
const MAX_GRID_COLS = 3;

interface GridCols {
  sm: number;
  md: number;
  lg: number;
}

function clampGridCols(value: number | string, fallback: number): number {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, MAX_GRID_COLS);
}

function parseGridCols(raw: string): GridCols {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return { ...DEFAULT_GRID_COLS };

  if (/^\d+$/.test(trimmed)) {
    const cols = clampGridCols(trimmed, DEFAULT_GRID_COLS.lg);
    return { sm: cols, md: cols, lg: cols };
  }

  if (trimmed.startsWith("{")) {
    try {
      const json = trimmed
        .replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":')
        .replace(/'/g, '"');
      const obj = JSON.parse(json) as Record<string, number>;
      return {
        sm: clampGridCols(obj.sm, DEFAULT_GRID_COLS.sm),
        md: clampGridCols(obj.md, DEFAULT_GRID_COLS.md),
        lg: clampGridCols(obj.lg, DEFAULT_GRID_COLS.lg),
      };
    } catch {
      return { ...DEFAULT_GRID_COLS };
    }
  }

  return { ...DEFAULT_GRID_COLS };
}

function renderGridStyle(cols: GridCols): string {
  return ` style="--card-grid-cols-sm: ${cols.sm}; --card-grid-cols-md: ${cols.md}; --card-grid-cols-lg: ${cols.lg};"`;
}

class CardGridBlockParser extends BaseBlockParser {
  constructor() {
    super("card_grid");
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
        { cols: parseGridCols(pickAttr(block.attrs, "cols")) },
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const cols = (node.props?.cols as GridCols | undefined) ?? DEFAULT_GRID_COLS;
    const items = (node.children ?? [])
      .map((child) => ctx.renderBlock([child]))
      .join("\n");

    return `<div class="cherry-card-grid"${renderGridStyle(cols)}>\n${items}\n</div>`;
  }
}

export const cardGridBlockParser = new CardGridBlockParser();
