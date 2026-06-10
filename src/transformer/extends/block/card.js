/**
 * @file 块级语法拓展：卡片 / 链接卡片 / 图片卡片 / 卡片网格
 * @module transformer/extends/block/card
 *
 * 语法：
 * ```
 * ::: card title="标题"
 * :::
 *
 * ::: link-card title="标题" link="https://example.com"
 * :::
 *
 * ::: image-card image="..." title="..." href="/" author="..." date="2024/08/16"
 * 描述正文（可选，也可用 description 属性）
 * :::
 *
 * :::: card-grid cols="2"
 * :::: card-grid cols="{ sm: 1, md: 2, lg: 3 }"
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";

/** 单卡片开标记 */
const CARD_OPEN_RE =
  /^ {0,3}:::(?!:)\s+(image-card|link-card|card)(?:\s+(.*))?\s*$/;

/** 单卡片闭标记：`:::` */
const CARD_CLOSE_RE = /^ {0,3}:::\s*$/;

/** 卡片网格开标记：`:::: card-grid cols="..."` */
const GRID_OPEN_RE = /^ {0,3}::::(?!:)\s+card-grid(?:\s+(.*))?\s*$/;

/** 卡片网格闭标记：`::::` */
const GRID_CLOSE_RE = /^ {0,3}::::\s*$/;

/** 默认列数：小屏单列，中大屏双列 */
const DEFAULT_GRID_COLS = { sm: 1, md: 2, lg: 2 };

/** 允许的最大列数 */
const MAX_GRID_COLS = 3;

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
 * 解析 card-grid 的 cols 参数。
 *
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
 * @param {string} line
 * @returns {{ cols: { sm: number, md: number, lg: number } } | null}
 */
function parseGridOpenLine(line) {
  const match = (line ?? "").match(GRID_OPEN_RE);
  if (!match) return null;

  return {
    cols: parseGridCols(pickAttr(match[1] ?? "", "cols")),
  };
}

/**
 * @param {{ sm: number, md: number, lg: number }} cols
 * @returns {string}
 */
function renderGridStyle(cols) {
  return ` style="--card-grid-cols-sm: ${cols.sm}; --card-grid-cols-md: ${cols.md}; --card-grid-cols-lg: ${cols.lg};"`;
}

/**
 * @param {string | undefined} raw
 * @returns {{
 *   kind: 'card' | 'link-card' | 'image-card',
 *   title: string,
 *   link: string,
 *   image: string,
 *   description: string,
 *   author: string,
 *   date: string,
 * }}
 */
function parseCardOpenLine(line) {
  const match = (line ?? "").match(CARD_OPEN_RE);
  if (!match) return null;

  const attrs = match[2] ?? "";
  const kindRaw = match[1];
  const kind =
    kindRaw === "image-card"
      ? "image-card"
      : kindRaw === "link-card"
        ? "link-card"
        : "card";

  return {
    kind,
    title: pickAttr(attrs, "title"),
    link: pickAttr(attrs, "link") || pickAttr(attrs, "href"),
    image: pickAttr(attrs, "image"),
    description: pickAttr(attrs, "description"),
    author: pickAttr(attrs, "author"),
    date: pickAttr(attrs, "date"),
  };
}

/**
 * @param {ReturnType<typeof parseCardOpenLine>} open
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} children
 * @returns {Record<string, unknown>}
 */
function cardNodeProps(open, children) {
  return {
    kind: open.kind,
    title: open.title,
    link: open.link,
    image: open.image,
    description: open.description,
    author: open.author,
    date: open.date,
    children,
  };
}

/**
 * @param {string} author
 * @param {string} date
 * @returns {string}
 */
function renderCopyright(author, date) {
  if (!author && !date) return "";

  const parts = [];
  if (author) parts.push(`<span>${escapeHtml(author)}</span>`);
  if (author && date) parts.push("<span> | </span>");
  if (date) parts.push(`<span>${escapeHtml(date)}</span>`);

  return `<p class="copyright">${parts.join("")}</p>`;
}

/**
 * @param {string} title
 * @param {string} href
 * @returns {string}
 */
function renderImageCardTitle(title, href) {
  if (!title) return "";
  if (href) {
    return `<h3 class="title"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>`;
  }
  return `<h3 class="title">${escapeHtml(title)}</h3>`;
}

/**
 * @param {string} descriptionAttr
 * @param {string} bodyHtml
 * @returns {string}
 */
function renderImageCardDescription(descriptionAttr, bodyHtml) {
  const body = bodyHtml.trim();
  if (body) {
    return `<div class="description">${body}</div>`;
  }
  if (descriptionAttr) {
    return `<p class="description">${escapeHtml(descriptionAttr)}</p>`;
  }
  return "";
}

/**
 * @param {Record<string, unknown>} card
 * @param {string} bodyHtml
 * @returns {string}
 */
function renderImageCardHtml(card, bodyHtml) {
  const image = String(card.image ?? "");
  const title = String(card.title ?? "");
  const link = String(card.link ?? "");
  const author = String(card.author ?? "");
  const date = String(card.date ?? "");
  const description = String(card.description ?? "");

  const img = image
    ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">`
    : "";

  const infoParts = [
    renderImageCardTitle(title, link),
    renderCopyright(author, date),
    renderImageCardDescription(description, bodyHtml),
  ].filter(Boolean);

  return [
    `<div class="image-card">`,
    `<div class="image-container">`,
    img,
    infoParts.length ? `<div class="image-info">${infoParts.join("\n")}</div>` : "",
    `</div>`,
    `</div>`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * @param {Record<string, unknown>} card
 * @param {string} bodyHtml
 * @returns {string}
 */
function renderCardHtml(card, bodyHtml) {
  const title = String(card.title ?? "");
  const link = String(card.link ?? "");
  const kind = card.kind ?? "card";
  const isLinkCard = kind === "link-card" && link;
  const tag = isLinkCard ? "a" : "div";
  const className = isLinkCard ? "card link-card" : "card";
  const href = isLinkCard
    ? ` href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"`
    : "";

  const parts = [`<${tag} class="${className}"${href}>`];
  if (title) {
    parts.push(`<p class="card-title">${escapeHtml(title)}</p>`);
  }
  if (bodyHtml) {
    parts.push(`<div class="card-body">${bodyHtml}</div>`);
  }
  parts.push(`</${tag}>`);
  return parts.join("\n");
}

/**
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} item
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext['renderBlock']} renderBlock
 * @returns {string}
 */
function renderCardItem(item, renderBlock) {
  const bodyHtml = renderBlock(item.children);
  const card = {
    kind: item.kind ?? "card",
    title: item.title ?? "",
    link: item.link ?? "",
    image: item.image ?? "",
    description: item.description ?? "",
    author: item.author ?? "",
    date: item.date ?? "",
  };

  if (card.kind === "image-card") {
    return renderImageCardHtml(card, bodyHtml);
  }
  return renderCardHtml(card, bodyHtml);
}

/**
 * @param {string[]} lines
 * @param {number} start
 * @returns {{ open: NonNullable<ReturnType<typeof parseCardOpenLine>>, innerLines: string[], nextIndex: number } | null}
 */
function readCardBlock(lines, start) {
  const open = parseCardOpenLine(lines[start]);
  if (!open) return null;

  const innerLines = [];
  let i = start + 1;

  while (i < lines.length) {
    if (CARD_CLOSE_RE.test(lines[i] ?? "")) {
      return { open, innerLines, nextIndex: i + 1 };
    }
    innerLines.push(lines[i]);
    i += 1;
  }

  return null;
}

/**
 * @param {string[]} lines
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @returns {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]}
 */
function parseNestedCards(lines, ctx) {
  const cards = [];
  let i = 0;

  while (i < lines.length) {
    const block = readCardBlock(lines, i);
    if (!block) {
      i += 1;
      continue;
    }

    cards.push(
      createNode(
        "card_item",
        cardNodeProps(
          block.open,
          ctx.parseBlocks(normalizeInnerLines(block.innerLines)),
        ),
      ),
    );
    i = block.nextIndex;
  }

  return cards;
}

/**
 * 单卡片块解析器。
 *
 * @extends {BaseBlockParser}
 */
class CardBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "card", priority: 87 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const block = readCardBlock(lines, index);
    if (!block) return null;

    return {
      node: createNode(
        this.type,
        cardNodeProps(
          block.open,
          ctx.parseBlocks(normalizeInnerLines(block.innerLines)),
        ),
      ),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    return renderCardItem(node, (children) => ctx.renderBlock(children));
  }
}

/**
 * 卡片网格块解析器。
 *
 * @extends {BaseBlockParser}
 */
class CardGridBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "card_grid", priority: 88 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const gridOpen = parseGridOpenLine(lines[index]);
    if (!gridOpen) return null;

    const innerLines = [];
    let i = index + 1;

    while (i < lines.length) {
      if (GRID_CLOSE_RE.test(lines[i] ?? "")) {
        const cards = parseNestedCards(normalizeInnerLines(innerLines), ctx);
        if (cards.length === 0) return null;

        return {
          node: createNode(this.type, {
            cols: gridOpen.cols,
            children: cards,
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
    const cols = node.cols ?? DEFAULT_GRID_COLS;
    const items = (node.children ?? [])
      .map((item) => renderCardItem(item, (children) => ctx.renderBlock(children)))
      .join("\n");

    return `<div class="card-grid"${renderGridStyle(cols)}>\n${items}\n</div>`;
  }
}

export const cardBlockParser = new CardBlockParser();
export const cardGridBlockParser = new CardGridBlockParser();
export default cardBlockParser;
