/**
 * @file CommonMark Tab 展开工具
 * @module transformer/utils/tabs
 *
 * 行首 tab 按 4 列制表位展开；行内 tab 保留原样。
 * 用于列表、引用块、缩进代码块等块级语法的缩进计算。
 */

/** Tab 制表位宽度（CommonMark 规范） */
const TAB_WIDTH = 4;

/** 缩进代码块 / 块结构分界（CommonMark 规范） */
export const CODE_INDENT = 4;

/**
 * 计算字符串在 index 处的视觉列位置。
 *
 * @param {string} str
 * @param {number} [index=str.length]
 * @returns {number}
 */
export function visualColumn(str, index = str.length) {
  let col = 0;
  for (let i = 0; i < index && i < str.length; i += 1) {
    if (str[i] === "\t") col += TAB_WIDTH - (col % TAB_WIDTH);
    else col += 1;
  }
  return col;
}

/**
 * 返回视觉列达到 targetCol 时的字符索引。
 *
 * @param {string} str
 * @param {number} targetCol
 * @returns {number}
 */
export function findIndexAtColumn(str, targetCol) {
  let col = 0;
  for (let i = 0; i < str.length; i += 1) {
    if (col >= targetCol) return i;
    if (str[i] === "\t") col += TAB_WIDTH - (col % TAB_WIDTH);
    else col += 1;
  }
  return str.length;
}

/**
 * 行首空白（空格/tab）的视觉列宽。
 *
 * @param {string} line
 * @returns {number}
 */
export function getIndent(line: string): number {
  let col = 0;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c !== " " && c !== "\t") return col;
    if (c === "\t") col += TAB_WIDTH - (col % TAB_WIDTH);
    else col += 1;
  }
  return col;
}

/**
 * 仅展开行首连续空白中的 tab，保留正文内 tab。
 *
 * @param {string} line
 * @returns {string}
 */
export function expandLinePrefixTabs(line) {
  let i = 0;
  while (i < line.length && (line[i] === " " || line[i] === "\t")) i += 1;
  const prefix = line.slice(0, i);
  const rest = line.slice(i);
  let expanded = "";
  let col = 0;
  for (const c of prefix) {
    if (c === " ") {
      expanded += " ";
      col += 1;
    } else {
      const spaces = TAB_WIDTH - (col % TAB_WIDTH);
      expanded += " ".repeat(spaces);
      col += spaces;
    }
  }
  return expanded + rest;
}

/**
 * 判断是否为缩进代码块行（缩进 ≥ 4 列）。
 *
 * @param {string} line
 * @returns {boolean}
 */
export function isIndentedCodeLine(line: string): boolean {
  return getIndent(line) >= CODE_INDENT;
}

/**
 * 去掉行首指定列数的视觉缩进。
 *
 * @param {string} line
 * @param {number} [spaces=CODE_INDENT]
 * @returns {string}
 */
export function stripVisualIndent(
  line: string,
  spaces: number = CODE_INDENT,
): string {
  return line.slice(findIndexAtColumn(line, spaces));
}

/**
 * 缩进代码块内容：展开行首 tab 后去掉一层 4 列缩进（8 列时保留 2 列）。
 *
 * @param {string} text
 * @returns {string}
 */
export function stripCodeContent(text) {
  const expanded = expandLinePrefixTabs(text);
  return stripVisualIndent(expanded, CODE_INDENT);
}

/**
 * 对齐 commonmark.js block_quote 起始：去掉 `>` 及可选分隔空白，返回展开后的剩余部分。
 *
 * @param {string} line
 * @returns {string}
 */
export function stripBlockquoteMarker(line) {
  const m = line.match(/^( {0,3})>/);
  if (!m) return line;

  let offset = m[0].length;
  let column = visualColumn(m[1]) + 1;

  // 按照 CommonMark 规范，如果 > 后紧跟空格或 tab，则消耗掉一个视觉上的空格
  if (offset < line.length && (line[offset] === " " || line[offset] === "\t")) {
    const ch = line[offset];
    if (ch === " ") {
      offset += 1;
      column += 1;
    } else {
      // Tab 展开，消耗掉 1 个视觉空格，剩下 3 个（如果 tab 宽 4）
      const toTab = TAB_WIDTH - (column % TAB_WIDTH);
      if (toTab > 1) {
        // 如果 tab 还没结束，我们需要手动展开它
        const expandedRemainder =
          " ".repeat(toTab - 1) + expandLinePrefixTabs(line.slice(offset + 1));
        return expandedRemainder;
      } else {
        offset += 1;
        column += toTab;
      }
    }
  }
  return expandLinePrefixTabs(line.slice(offset));
}

/**
 * 在行内按视觉列前进指定步数。
 *
 * @param {string} line
 * @param {number} offset
 * @param {number} column
 * @param {number} count
 * @param {boolean} inColumns
 * @returns {{ offset: number, column: number }}
 */
function advanceInLine(line, offset, column, count, inColumns) {
  let o = offset;
  let c = column;
  while (count > 0 && o < line.length) {
    const ch = line[o];
    if (ch === "\t") {
      const toTab = TAB_WIDTH - (c % TAB_WIDTH);
      if (inColumns) {
        const adv = Math.min(count, toTab);
        c += adv;
        count -= adv;
        if (adv < toTab) return { offset: o, column: c };
        o += 1;
      } else {
        c += toTab;
        o += 1;
        count -= 1;
      }
    } else {
      o += 1;
      c += 1;
      count -= 1;
    }
  }
  return { offset: o, column: c };
}

/**
 * 列表项 marker 行内容区 tab 展开（对齐 blockquote 的 partial-tab 规则）。
 *
 * @param {string} line
 * @param {number} contentOffset
 * @returns {string}
 */
export function expandListItemContent(line, contentOffset) {
  const column = visualColumn(line, contentOffset);
  let offset = contentOffset;

  if (offset < line.length && (line[offset] === " " || line[offset] === "\t")) {
    const ch = line[offset];
    if (ch === " ") {
      offset += 1;
      return expandLinePrefixTabs(line.slice(offset));
    }
    const toTab = TAB_WIDTH - (column % TAB_WIDTH);
    if (toTab > 1) {
      return (
        " ".repeat(toTab - 1) + expandLinePrefixTabs(line.slice(offset + 1))
      );
    }
    offset += 1;
  }
  return expandLinePrefixTabs(line.slice(offset));
}

/** 无序列表 marker 字符 */
const BULLET = /^[-+*]/;

/** 有序列表 marker 正则 */
const ORDERED = /^(\d{1,9})([.)])/;

/**
 * 解析列表标记行（对齐 commonmark.js parseListMarker）。
 *
 * @param {string} line
 * @param {Object} [options={}]
 * @param {boolean} [options.allowIndented=false]
 * @returns {null | {
 *   markerColumn: number,
 *   contentStartCol: number,
 *   contentOffset: number,
 *   content: string,
 *   ordered: boolean,
 *   bulletChar: string|null,
 *   start: number|null,
 *   delimiter: string|null
 * }}
 */
export function parseListMarkerLine(line, { allowIndented = false } = {}) {
  let offset = 0;
  let column = 0;
  while (
    offset < line.length &&
    (line[offset] === " " || line[offset] === "\t")
  ) {
    if (line[offset] === "\t") column += TAB_WIDTH - (column % TAB_WIDTH);
    else column += 1;
    offset += 1;
  }
  const markerOffset = column;
  const markerIndex = offset;

  const rest = line.slice(offset);
  let bulletChar = null;
  let ordered = false;
  let start: number | null = null;
  let delimiter = null;
  let markerLen = 0;

  const bullet = rest.match(BULLET);
  const ord = rest.match(ORDERED);
  if (bullet) {
    bulletChar = bullet[0];
    markerLen = 1;
  } else if (ord) {
    ordered = true;
    start = parseInt(ord[1], 10);
    delimiter = ord[2];
    markerLen = ord[0].length;
  } else {
    return null;
  }

  const afterMarker = rest[markerLen];
  if (afterMarker && afterMarker !== " " && afterMarker !== "\t") return null;

  if (!allowIndented && markerOffset >= CODE_INDENT) return null;

  offset += markerLen;
  column += markerLen;

  const spacesStartCol = column;
  const spacesStartOffset = offset;

  while (column - spacesStartCol < 5 && offset < line.length) {
    const c = line[offset];
    if (c !== " " && c !== "\t") break;
    if (c === "\t") column += TAB_WIDTH - (column % TAB_WIDTH);
    else column += 1;
    offset += 1;
  }

  const blank = offset >= line.length;
  const spacesAfter = column - spacesStartCol;

  let contentOffset;
  let contentStartCol;
  if (spacesAfter >= 5 || spacesAfter < 1 || blank) {
    offset = spacesStartOffset;
    column = spacesStartCol;
    contentStartCol = column;
    if (
      offset < line.length &&
      (line[offset] === " " || line[offset] === "\t")
    ) {
      ({ offset, column } = advanceInLine(line, offset, column, 1, true));
      contentStartCol = column;
    } else if (blank) {
      contentStartCol = spacesStartCol + 1;
    }
    contentOffset = offset;
  } else {
    contentStartCol = column;
    contentOffset = offset;
  }

  return {
    markerColumn: markerOffset,
    contentStartCol,
    contentOffset,
    content: line.slice(contentOffset),
    ordered,
    bulletChar,
    start,
    delimiter,
  };
}

interface ListMarkerLike {
  ordered?: boolean;
  isOrdered?: boolean;
  bulletChar?: string | null;
  delimiter?: string | null;
}

/**
 * 判断两个列表 marker 是否属于同一列表类型。
 */
export function listsMatch(
  a: ListMarkerLike | null,
  b: ListMarkerLike | null,
): boolean {
  if (!a || !b) return false;
  const aOrdered = a.ordered ?? a.isOrdered;
  const bOrdered = b.ordered ?? b.isOrdered;
  if (aOrdered !== bOrdered) return false;
  if (aOrdered) return a.delimiter === b.delimiter;
  return a.bulletChar === b.bulletChar;
}
