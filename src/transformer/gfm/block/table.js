/**
 * @file 块级语法：GFM 表格
 * @module transformer/gfm/block/table
 *
 * GitHub Flavored Markdown 管道表格。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { parseListMarkerLine } from "@/transformer/utils/tabs.js";
import { isThematicBreakLine } from "@/transformer/gfm/block/hr.js";

/**
 * 行内是否含未转义的管道符。
 *
 * @param {string} line
 * @returns {boolean}
 */
function lineHasUnescapedPipe(line) {
  for (let i = 0; i < line.length; i++) {
    if (line[i] === "\\" && i + 1 < line.length) {
      i += 1;
      continue;
    }
    if (line[i] === "|") return true;
  }
  return false;
}

/**
 * 去掉块级缩进（最多 3 列空格）。
 *
 * @param {string} line
 * @returns {string}
 */
function stripBlockIndent(line) {
  return (line ?? "").replace(/^ {0,3}/, "");
}

/**
 * 将 `\|` 还原为 `|`。
 *
 * @param {string} text
 * @returns {string}
 */
function unescapePipes(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\\" && i + 1 < text.length && text[i + 1] === "|") {
      out += "|";
      i += 1;
    } else {
      out += text[i];
    }
  }
  return out;
}

/**
 * @param {string} line 已去掉块缩进的行
 * @returns {string[] | null}
 */
export function parseTableRow(line) {
  const len = line.length;
  let offset = 0;
  const cells = [];

  offset += scanTableCellEnd(line, offset);

  let expectMoreCells = true;
  while (offset < len && expectMoreCells) {
    const cellMatched = scanTableCell(line, offset);
    const pipeMatched = scanTableCellEnd(line, offset + cellMatched);

    if (!cellMatched && !pipeMatched) break;

    const raw = line.slice(offset, offset + cellMatched);
    cells.push(unescapePipes(raw.trim()));
    offset += cellMatched + pipeMatched;

    if (pipeMatched) {
      expectMoreCells = true;
    } else {
      offset += scanTableRowEnd(line, offset);
      expectMoreCells = false;
    }
  }

  if (offset !== len || cells.length === 0) return null;
  return cells;
}

/**
 * 扫描表格单元格内容长度。
 *
 * @param {string} line
 * @param {number} offset
 * @returns {number}
 */
function scanTableCell(line, offset) {
  let i = offset;
  while (i < line.length) {
    if (line[i] === "\\" && i + 1 < line.length) {
      i += 2;
      continue;
    }
    if (line[i] === "|") break;
    i += 1;
  }
  return i - offset;
}

/**
 * 扫描单元格结束管道符及后续空白。
 *
 * @param {string} line
 * @param {number} offset
 * @returns {number}
 */
function scanTableCellEnd(line, offset) {
  if (line[offset] !== "|") return 0;
  let i = offset + 1;
  while (i < line.length && /[ \t]/.test(line[i])) i += 1;
  return i - offset;
}

/**
 * 扫描行尾空白。
 *
 * @param {string} line
 * @param {number} offset
 * @returns {number}
 */
function scanTableRowEnd(line, offset) {
  let i = offset;
  while (i < line.length && /[ \t]/.test(line[i])) i += 1;
  return i === line.length ? i - offset : 0;
}

/**
 * 解析分隔符行的列对齐方式。
 *
 * @param {string} line
 * @returns {("left"|"center"|"right")[] | null}
 */
function parseDelimiterAlignments(line) {
  const cells = parseTableRow(line);
  if (!cells) return null;

  const alignments = [];
  for (const cell of cells) {
    const t = cell.trim();
    if (!/^:?-+:?$/.test(t)) return null;

    const left = t.startsWith(":");
    const right = t.endsWith(":");
    if (left && right) alignments.push("center");
    else if (right) alignments.push("right");
    else alignments.push("left");
  }
  return alignments;
}

/**
 * 判断是否为表格分隔符行。
 *
 * @param {string} line
 * @returns {boolean}
 */
export function isTableDelimiterRow(line) {
  return parseDelimiterAlignments(stripBlockIndent(line)) !== null;
}

/**
 * 判断行是否会中断表格解析。
 *
 * @param {string} line
 * @returns {boolean}
 */
function isTableInterruptLine(line) {
  if (/^ {0,3}>/.test(line)) return true;
  if (/^ {0,3}#{1,6}(?: |$)/.test(line)) return true;
  if (isThematicBreakLine(line)) return true;
  if (/^ {0,3}(`{3,}|~{3,})/.test(line)) return true;
  if (parseListMarkerLine(line)) return true;
  return false;
}

/**
 * 将单元格数组补齐或截断到指定列数。
 *
 * @param {string[]} cells
 * @param {number} numCols
 * @returns {string[]}
 */
function normalizeRowCells(cells, numCols) {
  const row = cells.slice(0, numCols);
  while (row.length < numCols) row.push("");
  return row;
}

/**
 * 创建表格行 AST 节点。
 *
 * @param {string[]} cells
 * @param {("left"|"center"|"right")[]} align
 * @param {boolean} isHeader
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @returns {import('@/transformer/core/MarkdownNode.js').MarkdownNode}
 */
function makeTableRow(cells, align, isHeader, ctx) {
  return createNode("table_row", {
    isHeader,
    children: cells.map((text, i) =>
      createNode("table_cell", {
        align: align[i] ?? "left",
        isHeader,
        children: ctx.parseInline(text),
      }),
    ),
  });
}

/**
 * 渲染表格行 HTML。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} row
 * @param {import('@/transformer/core/ParserContext.js').RenderContext} ctx
 * @returns {string}
 */
function renderTableRow(row, ctx) {
  const tag = row.props?.isHeader ? "th" : "td";
  const cells = row.children
    .map((cell) => {
      const align = cell.props?.align;
      const alignAttr =
        align === "center"
          ? ' align="center"'
          : align === "right"
            ? ' align="right"'
            : "";
      return `<${tag}${alignAttr}>${ctx.renderInline(cell.children)}</${tag}>`;
    })
    .join("\n");
  return `<tr>\n${cells}\n</tr>`;
}

/**
 * GFM 表格块解析器。
 *
 * @extends {BaseBlockParser}
 */
class TableBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "table", priority: 70, canInterruptParagraph: true });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    if (index + 1 >= lines.length) return null;

    const headerLine = stripBlockIndent(lines[index]);
    const delimLine = stripBlockIndent(lines[index + 1]);
    const align = parseDelimiterAlignments(delimLine);

    if (!align) {
      if (index > 0 && isTableDelimiterRow(headerLine)) {
        const prevCells = parseTableRow(stripBlockIndent(lines[index - 1]));
        const prevAlign = parseDelimiterAlignments(headerLine);
        if (prevCells && prevAlign && prevCells.length === prevAlign.length) {
          return { node: null, nextIndex: index };
        }
      }
      return null;
    }

    const headerCells = parseTableRow(headerLine);
    if (!headerCells || headerCells.length !== align.length) return null;
    if (!lineHasUnescapedPipe(headerLine)) return null;

    const numCols = align.length;
    const headerRow = makeTableRow(headerCells, align, true, ctx);
    const bodyRows = [];
    let i = index + 2;

    while (i < lines.length) {
      const raw = lines[i];
      if (raw.trim() === "") break;
      if (isTableInterruptLine(raw)) break;

      const cells = parseTableRow(stripBlockIndent(raw));
      if (!cells) break;

      bodyRows.push(makeTableRow(normalizeRowCells(cells, numCols), align, false, ctx));
      i += 1;
    }

    const children = [createNode("table_head", { children: [headerRow] })];
    if (bodyRows.length > 0) {
      children.push(createNode("table_body", { children: bodyRows }));
    }

    return {
      node: createNode("table", { align, children }),
      nextIndex: i,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const parts = ["<table>"];

    for (const section of node.children ?? []) {
      const rows = section.children ?? [];
      if (rows.length === 0) continue;

      if (section.type === "table_head") {
        parts.push("<thead>");
        for (const row of rows) parts.push(renderTableRow(row, ctx));
        parts.push("</thead>");
      } else if (section.type === "table_body") {
        parts.push("<tbody>");
        for (const row of rows) parts.push(renderTableRow(row, ctx));
        parts.push("</tbody>");
      }
    }

    parts.push("</table>");
    return parts.join("\n");
  }
}

export default new TableBlockParser();
