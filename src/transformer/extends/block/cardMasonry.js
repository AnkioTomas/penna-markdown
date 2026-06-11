/**
 * @file 块级语法拓展：卡片瀑布流容器
 * @module transformer/extends/block/cardMasonry
 *
 * 语法：
 * ```
 * :::: card-masonry cols="3" gap="16"
 * ![alt](/images/1.png)
 * ::: card title="卡片1"
 * 内容
 * :::
 * ::::
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";

/** 瀑布流开标记：`:::: card-masonry` */
const MASONRY_OPEN_RE = /^ {0,3}::::(?!:)\s+card-masonry(?:\s+(.*))?\s*$/;

/** 瀑布流闭标记：`::::` */
const MASONRY_CLOSE_RE = /^ {0,3}::::\s*$/;

const DEFAULT_MASONRY_COLS = 3;
const DEFAULT_MASONRY_GAP = 16;
const MAX_MASONRY_COLS = 3;

/**
 * @param {string} raw
 * @param {string} name
 * @returns {string}
 */
function pickAttr(raw, name) {
  const match = String(raw ?? "").match(new RegExp(`\\b${name}="([^"]*)"`));
  return match?.[1] ?? "";
}

/**
 * @param {string} raw
 * @param {number} fallback
 * @returns {number}
 */
function parseMasonryCols(raw, fallback = DEFAULT_MASONRY_COLS) {
  const trimmed = String(raw ?? "").trim();
  if (!/^\d+$/.test(trimmed)) return fallback;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, MAX_MASONRY_COLS);
}

/**
 * @param {string} raw
 * @returns {number}
 */
function parseMasonryGap(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!/^\d+$/.test(trimmed)) return DEFAULT_MASONRY_GAP;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_MASONRY_GAP;
}

/**
 * @param {string} line
 * @returns {{ cols: number, gap: number } | null}
 */
function parseMasonryOpenLine(line) {
  const match = (line ?? "").match(MASONRY_OPEN_RE);
  if (!match) return null;

  const attrs = match[1] ?? "";
  return {
    cols: parseMasonryCols(pickAttr(attrs, "cols")),
    gap: parseMasonryGap(pickAttr(attrs, "gap")),
  };
}

/**
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} items
 * @param {number} cols
 * @returns {Array<Array<{ index: number, node: import('@/transformer/core/MarkdownNode.js').MarkdownNode }>>}
 */
function distributeMasonryItems(items, cols) {
  const columns = Array.from({ length: cols }, () => []);
  items.forEach((node, index) => {
    columns[index % cols].push({ index, node });
  });
  return columns;
}

/**
 * 卡片瀑布流块解析器。
 *
 * @extends {BaseBlockParser}
 */
class CardMasonryBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "card_masonry", priority: 89 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const open = parseMasonryOpenLine(lines[index]);
    if (!open) return null;

    const innerLines = [];
    let i = index + 1;

    while (i < lines.length) {
      if (MASONRY_CLOSE_RE.test(lines[i] ?? "")) {
        const children = ctx.parseBlocks(normalizeInnerLines(innerLines));
        if (children.length === 0) return null;

        return {
          node: createNode(this.type, {
            cols: open.cols,
            gap: open.gap,
            children,
          }),
          nextIndex: i + 1,
        };
      }
      innerLines.push(lines[i]);
      i += 1;
    }

    return null;
  }

  /** @inheritdoc */
  render(node, ctx) {
    const cols = node.cols ?? DEFAULT_MASONRY_COLS;
    const gap = node.gap ?? DEFAULT_MASONRY_GAP;
    const children = node.children ?? [];
    const total = children.length;
    const columns = distributeMasonryItems(children, cols);

    const columnHtml = columns
      .map((items) => {
        const itemHtml = items
          .map(({ index, node: child }) => {
            const html = ctx.renderBlock([child]);
            return `<div class="masonry-v-${total}-${index}">${html}</div>`;
          })
          .join("\n");

        return `<div class="card-masonry-item" style="gap: ${gap}px;">\n${itemHtml}\n</div>`;
      })
      .join("\n");

    return `<div class="card-masonry cols-${cols}" style="gap: ${gap}px; --card-masonry-cols: ${cols};">\n${columnHtml}\n</div>`;
  }
}

export const cardMasonryBlockParser = new CardMasonryBlockParser();
export default cardMasonryBlockParser;
