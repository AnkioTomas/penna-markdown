/**
 * @file 块级语法：列表
 * @module transformer/gfm/block/list
 *
 * CommonMark / GFM 有序与无序列表及 list item。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { RenderContext } from "@/transformer/core/context/RenderContext";

import { isThematicBreakLine } from "@/transformer/gfm/block/hr.js";
import { canGenericLazyContinue } from "@/transformer/utils/lazyContinuation.js";
import { isBlankString } from "@/transformer/utils/normalize";
import { expandLinePrefixTabs, expandListItemContent, getIndent, isIndentedCodeLine, listsMatch, parseListMarkerLine } from "@/transformer/utils/tabs.js";

interface ListMarkerInfo {
  isOrdered: boolean;
  bulletChar?: string;
  delimiter?: string;
  start?: number;
  indent: number;           // 前置缩进 (0-3)
  contentStart: number;     // 文本内容真实开始的字符索引
  contentStartCol: number;  // 文本内容开始的视觉列（Tab 按 4 列展开）
  isBlank: boolean;         // 标记后是否全为空白
}

/**
 * 提取 List 标记，委托 tabs 模块按视觉列解析（含 marker 后 Tab）。
 */
function getListMarkerInfo(
  line: string,
  { allowIndented = false }: { allowIndented?: boolean } = {},
): ListMarkerInfo | null {
  const marker = parseListMarkerLine(line, { allowIndented });
  if (!marker) return null;

  return {
    isOrdered: marker.ordered,
    bulletChar: marker.bulletChar ?? undefined,
    delimiter: marker.delimiter ?? undefined,
    start: marker.start ?? undefined,
    indent: marker.markerColumn,
    contentStart: marker.contentOffset,
    contentStartCol: marker.contentStartCol,
    isBlank: isBlankString(marker.content),
  };
}

/**
 * 列表块解析器。
 * * 采用游标遍历，去除任何对外部具体解析器的强依赖。
 * @extends {BaseBlockParser}
 */
class ListBlockParser extends BaseBlockParser {
  constructor() {
    super("list");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    const line = lines[index] ?? "";
    const marker = getListMarkerInfo(line);
    if (!marker) return false;

    // 段落打断规则：如果有序列表打断段落，其起始必须是 1；且空列表项不能打断段落
    if (index > 0) {
      const prevLine = lines[index - 1] ?? "";
      if (!isBlankString(prevLine)) {
        if (marker.isBlank) return false;
        if (marker.isOrdered && marker.start !== 1) return false;
      }
    }

    return true;
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    const initialMarker = getListMarkerInfo(line);
    if (!initialMarker) return null;

    // 再次进行打断规则校验
    if (index > 0 && !isBlankString(lines[index - 1] ?? "")) {
      if (initialMarker.isBlank) return null;
      if (initialMarker.isOrdered && initialMarker.start !== 1) return null;
    }

    const listItems: MarkdownNode[] = [];
    let length = 0;
    let i = index;
    let isListLoose = false;
    let hadBlankLineBetweenItems = false;

    while (i < lines.length) {
      const itemMarker = getListMarkerInfo(lines[i]);

      // 1. 如果无法被识别为 Marker，退出外层循环
      if (!itemMarker) break;

      // 2. 如果 Marker 类型与当前列表不匹配，退出外层循环 (交由外层去开启新的 List)
      if (!listsMatch(itemMarker, initialMarker)) {
        break;
      }

      // 3. thematic break 优先于 list item（GFM Example 30）
      if (isThematicBreakLine(lines[i] ?? "")) {
        break;
      }

      // --- 开始消费一个新的 List Item ---
      const itemLines: string[] = [];
      let itemLength = 0;

      // 剥去内容起始的缩进
      const firstLine = lines[i];
      itemLength += firstLine.length;
      const rawMarker = parseListMarkerLine(firstLine);
      let firstContent = expandListItemContent(firstLine, itemMarker.contentStart);
      // GFM 规则 #2：marker 行以 4+ 空格缩进代码开头（不含 tab 场景，见 Example 7）
      if (rawMarker && /^ {4,}/.test(rawMarker.content)) {
        firstContent = expandLinePrefixTabs(rawMarker.content);
      }
      itemLines.push(firstContent);

      if (hadBlankLineBetweenItems && listItems.length > 0) {
        isListLoose = true;
      }

      hadBlankLineBetweenItems = false;
      i++;

      let itemHadBlankLine = false;

      // 消费 List Item 的内部行
      while (i < lines.length) {
        const currentLine = lines[i];

        // A. 遇到空行
        if (isBlankString(currentLine)) {
          itemHadBlankLine = true;
          itemLines.push("");
          itemLength += currentLine.length;
          i++;
          // GFM #258：空 marker 后至多一行空行，再遇到空行则结束 item
          if (itemMarker.isBlank) {
            break;
          }
          continue;
        }

        // B. 遇到新的 Marker
        const nextMarker = getListMarkerInfo(currentLine, { allowIndented: true });
        if (nextMarker) {
          if (listsMatch(nextMarker, initialMarker) && nextMarker.indent <= initialMarker.indent) {
            break;
          }
          if (!listsMatch(nextMarker, initialMarker) && getIndent(currentLine) < itemMarker.contentStartCol) {
            break;
          }
        }

        // C. 检查缩进（Tab 按 4 列制表位计入视觉列）
        if (getIndent(currentLine) >= itemMarker.contentStartCol) {
          itemLength += currentLine.length;
          itemLines.push(expandLinePrefixTabs(currentLine).slice(itemMarker.contentStartCol));
          i++;
          continue;
        }

        // C-2. 缩进不足，尝试惰性延续 (Lazy Continuation)
        // 空行之后不允许 lazy continue（GFM #233 / #254 / #238）
        if (itemHadBlankLine) {
          break;
        }

        // 规则 1：强块级起点打断（4 空格缩进行除外，见 GFM #269）
        if (ctx.isBlockStarter(lines, i) && !isIndentedCodeLine(currentLine)) {
          break;
        }

        // 规则 2：使用通用探针评估深层 AST
        if (canGenericLazyContinue(
            ctx,
            itemLines,
            currentLine,
            (probeLines) => ctx.parseBlocks(probeLines)
        )) {
          itemLength += currentLine.length;
          // 惰性延续行无需剥离前缀，直接塞入
          itemLines.push(currentLine);
          i++;
          continue;
        }

        // 都不符合，当前 Item 被彻底截断
        break;
      }

      // 空 marker 行首占位（含 `-   ` 仅空格）不是内容
      if (itemMarker.isBlank) {
        while (itemLines.length > 0 && isBlankString(itemLines[0])) {
          itemLines.shift();
        }
      }

      // 移除尾部多余的空行，并标记遇到了空行
      while (itemLines.length > 0 && isBlankString(itemLines[itemLines.length - 1])) {
        itemLines.pop();
        hadBlankLineBetweenItems = true;
      }

      // 列表项内部仍含空行 → loose（GFM #234）；尾部空行 pop 后不算
      if (itemHadBlankLine && itemLines.some((l) => isBlankString(l))) {
        isListLoose = true;
      }

      const itemChildren = ctx.parseBlocks(itemLines);
      listItems.push(createNode("list_item", itemLength, undefined, itemChildren));
      length += itemLength;
    }

    const node = createNode("list", length, undefined, listItems, {
      ordered: initialMarker.isOrdered,
      start: initialMarker.start,
      bulletChar: initialMarker.bulletChar,
      delimiter: initialMarker.delimiter,
      loose: isListLoose
    });

    return { node, nextIndex: i };
  }

  /**
   * 渲染单个 list item (解耦后，逻辑更清晰)
   */
  renderListItem(item: MarkdownNode, ctx: RenderContext, isLoose: boolean) {
    if (!item.children || item.children.length === 0) {
      return "<li></li>";
    }

    // 松散列表：全保留 <p>
    if (isLoose) {
      const innerHtml = ctx.renderBlock(item.children);
      return `<li>\n${innerHtml}\n</li>`;
    }

    // 紧密列表：剥掉外部包裹的唯一 <p>
    if (item.children.length === 1 && item.children[0].type === "paragraph") {
      return `<li>${ctx.renderInline(item.children[0].children)}</li>`;
    }

    const parts = item.children.map((child) => {
      if (child.type === "paragraph") {
        return ctx.renderInline(child.children);
      }
      return ctx.renderBlock([child]).replace(/\n$/, "");
    });

    const lead = item.children[0].type !== "paragraph" ? "\n" : "";
    const tail = item.children[item.children.length - 1].type === "paragraph" ? "" : "\n";
    return `<li>${lead}${parts.join("\n")}${tail}</li>`;
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    const props = node.props || {};
    const tag = props.ordered ? "ol" : "ul";
    const startAttr = props.ordered && props.start !== 1 ? ` start="${props.start}"` : "";
    const isLoose = props.loose as boolean;

    const itemsHtml = (node.children || [])
        .map((item) => this.renderListItem(item, ctx, isLoose))
        .join("\n");

    return `<${tag}${startAttr}>\n${itemsHtml}\n</${tag}>`;
  }
}

export default new ListBlockParser();