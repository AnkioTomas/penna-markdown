/**
 * @file 卡片语法公共工具
 * @module transformer/extends/block/card/shared
 */

/** 三冒号块闭标记 */
export const TRIPLE_CLOSE_RE = /^ {0,3}:::\s*$/;

/** 四冒号块闭标记 */
export const QUAD_CLOSE_RE = /^ {0,3}::::\s*$/;

/** 单卡片块解析优先级（须高于 container） */
export const CARD_BLOCK_PRIORITY = 90;

/** 卡片网格块解析优先级 */
export const CARD_GRID_PRIORITY = 91;

/** 卡片瀑布流块解析优先级 */
export const CARD_MASONRY_PRIORITY = 92;

/**
 * @param {string} raw
 * @param {string} name
 * @returns {string}
 */
export function pickAttr(raw, name) {
  const match = String(raw ?? "").match(new RegExp(`\\b${name}="([^"]*)"`));
  return match?.[1] ?? "";
}

/**
 * 解析 title 属性为行内 AST。
 *
 * @param {string} attrs
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @returns {{
 *   title: string,
 *   titleNodes: import('@/transformer/core/MarkdownNode.js').MarkdownNode[],
 * }}
 */
export function parseTitleInline(attrs, ctx) {
  const title = pickAttr(attrs, "title");
  return {
    title,
    titleNodes: title ? ctx.parseInline(title) : [],
  };
}

/**
 * 去掉开标记行中的 link / href 属性，剩余文本作为标题。
 *
 * @param {string} attrs
 * @returns {string}
 */
export function stripLinkAttrs(attrs) {
  return String(attrs ?? "")
    .replace(/\b(?:link|href|icon|image)="[^"]*"/g, "")
    .trim();
}

/**
 * @param {string} attrs
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @returns {{
 *   title: string,
 *   titleNodes: import('@/transformer/core/MarkdownNode.js').MarkdownNode[],
 *   link: string,
 *   icon: string,
 * }}
 */
export function parseLinkCardOpen(attrs, ctx) {
  const link = pickAttr(attrs, "link") || pickAttr(attrs, "href");
  const icon = pickAttr(attrs, "icon") || pickAttr(attrs, "image");
  const title = stripLinkAttrs(attrs);
  return {
    title,
    titleNodes: title ? ctx.parseInline(title) : [],
    link,
    icon,
  };
}

/**
 * @param {string} attrs
 * @returns {{ repo: string, link: string, visibility: string }}
 */
export function parseRepoCardOpen(attrs) {
  const trimmed = String(attrs ?? "").trim();
  if (!trimmed) {
    return { repo: "", link: "", visibility: "Public" };
  }

  const match = trimmed.match(/^(\S+)(?:\s+(.*))?$/);
  const repo = (match?.[1] ?? "").replace(/\.git$/, "");
  const rest = match?.[2] ?? "";

  return {
    repo,
    link: pickAttr(rest, "link") || pickAttr(rest, "href"),
    visibility: pickAttr(rest, "visibility") || "Public",
  };
}

/**
 * @param {string[]} lines
 * @param {number} start
 * @param {RegExp} openRe
 * @returns {{ attrs: string, innerLines: string[], nextIndex: number } | null}
 */
export function readTripleColonBlock(lines, start, openRe) {
  const line = lines[start] ?? "";
  const match = line.match(openRe);
  if (!match) return null;

  const innerLines = [];
  let i = start + 1;

  while (i < lines.length) {
    if (TRIPLE_CLOSE_RE.test(lines[i] ?? "")) {
      return { attrs: match[1] ?? "", innerLines, nextIndex: i + 1 };
    }
    innerLines.push(lines[i]);
    i += 1;
  }

  return null;
}

/**
 * @param {string[]} lines
 * @param {number} start
 * @param {RegExp} openRe
 * @returns {{ attrs: string, innerLines: string[], nextIndex: number } | null}
 */
export function readQuadColonBlock(lines, start, openRe) {
  const line = lines[start] ?? "";
  const match = line.match(openRe);
  if (!match) return null;

  const innerLines = [];
  let i = start + 1;

  while (i < lines.length) {
    if (QUAD_CLOSE_RE.test(lines[i] ?? "")) {
      return { attrs: match[1] ?? "", innerLines, nextIndex: i + 1 };
    }
    innerLines.push(lines[i]);
    i += 1;
  }

  return null;
}
