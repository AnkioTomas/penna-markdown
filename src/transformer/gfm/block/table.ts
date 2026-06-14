/**
 * @file 块级语法：GFM 表格
 * @module transformer/gfm/block/table
 *
 * GitHub Flavored Markdown 管道表格。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";
import { isBlankString } from "@/transformer/utils/normalize";

type Alignment = "left" | "center" | "right" | "none";

/**
 * 核心工具：无正则提取表格行。
 * 处理了 GFM 表格特有的转义管道符 `\|` 以及首尾的边界条件。
 * @returns 包含单元格数组与是否含有未转义管道符的标志
 */
export function parseTableRow(line: string): { cells: string[]; hasUnescapedPipe: boolean } | null {
  let start = skipBlockPrefixSpaces(line);

  let end = line.length;
  // 2. 忽略尾随的空白符
  while (end > start && (line[end - 1] === ' ' || line[end - 1] === '\t' || line[end - 1] === '\n' || line[end - 1] === '\r')) {
    end--;
  }

  if (start === end) return null;

  let hasUnescapedPipe = false;
  let i = start;

  // 3. 检查起始的管道符 (GFM 中行首的 | 是可选的)
  if (line[i] === '|') {
    hasUnescapedPipe = true;
    i++;
  }

  const cells: string[] = [];
  let currentCell = "";

  // 4. 逐字符扫描，遇到未转义的 | 进行切分
  while (i < end) {
    if (line[i] === '\\' && i + 1 < end && line[i + 1] === '|') {
      currentCell += '|'; // 还原被转义的管道符
      i += 2;
    } else if (line[i] === '|') {
      hasUnescapedPipe = true;
      cells.push(currentCell.trim()); // 表格规范允许清空前后的空格
      currentCell = "";
      i++;
    } else {
      currentCell += line[i];
      i++;
    }
  }

  // 5. 检查并处理结尾的边界条件
  // 如果最后不是以未转义的管道符结尾，则把最后收集到的文本算作一个格子
  let isTrailingPipe = false;
  if (end > start && line[end - 1] === '|') {
    // 检查是不是被转义的尾管 (如 `\\|`)
    let backslashCount = 0;
    let k = end - 2;
    while (k >= start && line[k] === '\\') {
      backslashCount++;
      k--;
    }
    if (backslashCount % 2 === 0) {
      isTrailingPipe = true;
    }
  }

  if (!isTrailingPipe) {
    cells.push(currentCell.trim());
  }

  return { cells, hasUnescapedPipe };
}

/**
 * 校验并提取分隔行 (Delimiter Row) 的对齐属性。
 * 必须只由 `-`、`:`、`|` 和空格组成，且每个格子至少有一个 `-`
 */
function parseDelimiterRow(line: string): Alignment[] | null {
  const parsed = parseTableRow(line);
  if (!parsed || parsed.cells.length === 0) return null;

  const alignments: Alignment[] = [];

  for (let i = 0; i < parsed.cells.length; i++) {
    const cell = parsed.cells[i];
    if (cell.length === 0) return null;

    const isLeft = cell[0] === ':';
    const isRight = cell[cell.length - 1] === ':';

    const start = isLeft ? 1 : 0;
    const end = isRight ? cell.length - 1 : cell.length;

    // 格式错误：没有破折号 (例如 ":" 或 "::")
    if (start >= end) return null;

    // 中间必须全部是破折号
    for (let j = start; j < end; j++) {
      if (cell[j] !== '-') return null;
    }

    if (isLeft && isRight) alignments.push("center");
    else if (isRight) alignments.push("right");
    else if (isLeft) alignments.push("left");
    else alignments.push("none");
  }

  return alignments;
}

/**
 * GFM 表格块解析器。
 * * 纯游标扫描，零正则，零上下文耦合。
 * @extends {BaseBlockParser}
 */
class TableBlockParser extends BaseBlockParser {
  constructor() {
    super("table");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    if (index + 1 >= lines.length) return false;

    // 1. 解析表头
    const headerParsed = parseTableRow(lines[index] ?? "");
    // GFM 规范：表头必须有未转义的管道符
    if (!headerParsed || !headerParsed.hasUnescapedPipe) return false;

    // 2. 解析分隔行
    const align = parseDelimiterRow(lines[index + 1] ?? "");
    if (!align) return false;

    // 3. 列数必须一致
    return headerParsed.cells.length === align.length;


  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    if (index + 1 >= lines.length) return null;

    const headerLine = lines[index];
    const delimLine = lines[index + 1];

    const headerParsed = parseTableRow(headerLine);
    if (!headerParsed || !headerParsed.hasUnescapedPipe) return null;

    const align = parseDelimiterRow(delimLine);
    if (!align || headerParsed.cells.length !== align.length) return null;

    const numCols = align.length;
    let totalLength = headerLine.length + delimLine.length;

    // 创建 Header 行 AST
    const headerRow = createNode("table_row", headerLine.length, undefined,
        headerParsed.cells.map((text, i) =>
            createNode("table_cell", text.length, undefined, ctx.parseInline(text), {
              align: align[i],
              isHeader: true
            })
        ), { isHeader: true }
    );

    const bodyRows: MarkdownNode[] = [];
    let i = index + 2;

    while (i < lines.length) {
      const line = lines[i];

      // 1. 遇空行结束
      if (isBlankString(line)) break;

      // 2. 遇到强块级起点打断 (无缝接入引擎的统一调度！)
      // 这取代了你原代码中非常恶心的 isTableInterruptLine 枚举耦合
      if (ctx.isBlockStarter(line)) {
        break;
      }

      // 3. 解析为表格数据行
      const rowParsed = parseTableRow(line);
      // GFM 规范：数据行内部即使列不够/超出，只要是普通行且不是别的块语法，就算作表格的一部分
      // 但它本身必须包含未转义管道符，否则宣告表格中断
      if (!rowParsed || !rowParsed.hasUnescapedPipe) {
        break;
      }

      // 截断或补齐空格至表头列数
      const rowCells = rowParsed.cells.slice(0, numCols);
      while (rowCells.length < numCols) rowCells.push("");

      bodyRows.push(
          createNode("table_row", line.length, undefined,
              rowCells.map((text, j) =>
                  createNode("table_cell", text.length, undefined, ctx.parseInline(text), {
                    align: align[j],
                    isHeader: false
                  })
              ), { isHeader: false }
          )
      );

      totalLength += line.length;
      i++;
    }

    const children = [createNode("table_head", headerLine.length, undefined, [headerRow])];

    if (bodyRows.length > 0) {
      // 近似计算 body 部分占用的总源码长度
      const bodyLength = bodyRows.reduce((acc, row) => acc + (row.length || 0), 0);
      children.push(createNode("table_body", bodyLength, undefined, bodyRows));
    }

    const node = createNode("table", totalLength, undefined, children, { align });

    return { node, nextIndex: i };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    const parts = ["<table>"];

    for (const section of node.children ?? []) {
      const rows = section.children ?? [];
      if (rows.length === 0) continue;

      if (section.type === "table_head") {
        parts.push("<thead>");
        for (const row of rows) parts.push(this.renderRowHtml(row, ctx));
        parts.push("</thead>");
      } else if (section.type === "table_body") {
        parts.push("<tbody>");
        for (const row of rows) parts.push(this.renderRowHtml(row, ctx));
        parts.push("</tbody>");
      }
    }

    parts.push("</table>");
    return parts.join("\n");
  }

  private renderRowHtml(row: MarkdownNode, ctx: RenderContext): string {
    const isHeader = row.props?.isHeader;
    const tag = isHeader ? "th" : "td";

    const cellsHtml = (row.children || []).map((cell) => {
      const align = cell.props?.align;
      const alignAttr = (align && align !== "none") ? ` align="${align}"` : "";
      return `<${tag}${alignAttr}>${ctx.renderInline(cell.children)}</${tag}>`;
    }).join("\n");

    return `<tr>\n${cellsHtml}\n</tr>`;
  }
}

export default new TableBlockParser();