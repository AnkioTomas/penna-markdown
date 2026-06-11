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
