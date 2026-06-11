/**
 * @file 块级语法拓展：卡片网格
 * @module transformer/extends/block/card/cardGrid
 *
 * ```
 * :::: card-grid cols="2"
 * :::: card-grid cols="{ sm: 1, md: 2, lg: 3 }"
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  CARD_GRID_PRIORITY,
  pickAttr,
  readQuadColonBlock,
} from "./shared.js";

const OPEN_RE = /^ {0,3}::::(?!:)\s+card-grid(?:\s+(.*))?\s*$/;

const DEFAULT_GRID_COLS = { sm: 1, md: 2, lg: 2 };
const MAX_GRID_COLS = 3;

/**
 * @param {number | string} value
 * @param {number} fallback
 * @returns {number}
 */
function clampGridCols(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, MAX_GRID_COLS);
}

/**
 * @param {string} raw
 * @returns {{ sm: number, md: number, lg: number }}
 */
function parseGridCols(raw) {
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
      const obj = JSON.parse(json);
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

/**
 * @param {{ sm: number, md: number, lg: number }} cols
 * @returns {string}
 */
function renderGridStyle(cols) {
  return ` style="--card-grid-cols-sm: ${cols.sm}; --card-grid-cols-md: ${cols.md}; --card-grid-cols-lg: ${cols.lg};"`;
}

class CardGridBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "card_grid", priority: CARD_GRID_PRIORITY });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const block = readQuadColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const children = ctx.parseBlocks(normalizeInnerLines(block.innerLines));
    if (children.length === 0) return null;

    return {
      node: createNode(this.type, {
        cols: parseGridCols(pickAttr(block.attrs, "cols")),
        children,
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const cols = node.cols ?? DEFAULT_GRID_COLS;
    const items = (node.children ?? [])
      .map((child) => ctx.renderBlock([child]))
      .join("\n");

    return `<div class="card-grid"${renderGridStyle(cols)}>\n${items}\n</div>`;
  }
}

export const cardGridBlockParser = new CardGridBlockParser();
