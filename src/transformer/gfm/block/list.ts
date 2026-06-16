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

/** 有序列表在非段落上下文可开启（GFM #282：前一行是 list marker 时允许 start≠1） */
function canOrderedListOpenAt(
  lines: string[],
  index: number,
  marker: ListMarkerInfo,
): boolean {
  if (index > 0) {
    const prevLine = lines[index - 1] ?? "";
    if (!isBlankString(prevLine)) {
      if (marker.isBlank) return false;
      if (marker.isOrdered && marker.start !== 1 && !getListMarkerInfo(prevLine)) {
        return false;
      }
    }
  }
  return true;
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

/** 从 start 起找下一非空行的视觉缩进列，无则 null */
function getNextNonBlankIndent(lines: string[], start: number): number | null {
  for (let j = start; j < lines.length; j++) {
    if (!isBlankString(lines[j])) return getIndent(lines[j]);
  }
  return null;
}

/** 更新 item 行收集过程中的围栏代码块状态 */
function updateFenceState(
  line: string,
  inFence: boolean,
  fenceChar: string,
): { inFence: boolean; fenceChar: string } {
  const trimmed = line.trimStart();
  const open = trimmed.match(/^(`{3,}|~{3,})/);
  if (!open) return { inFence, fenceChar };
  const ch = open[1][0];
  if (!inFence) return { inFence: true, fenceChar: ch };
  if (ch === fenceChar) return { inFence: false, fenceChar: "" };
  return { inFence, fenceChar };
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

    return canOrderedListOpenAt(lines, index, marker);
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    const initialMarker = getListMarkerInfo(line);
    if (!initialMarker) return null;

    if (!canOrderedListOpenAt(lines, index, initialMarker)) return null;

    const listItems: MarkdownNode[] = [];
    let length = 0;
    let i = index;
    let listLooseFromBlankBetweenItems = false;
    let hadBlankLineBetweenItems = false;

    while (i < lines.length) {
      const itemMarker = getListMarkerInfo(lines[i]);

      if (!itemMarker) {
        if (ctx.canStrongBreak(lines, i, false)) {
          i = ctx.parseBlockAt(lines, i, false).nextIndex;
          continue;
        }
        break;
      }

      // 2. thematic break 优先于 list item（GFM Example 64/69）
      if (isThematicBreakLine(lines[i] ?? "")) {
        break;
      }

      // 3. Marker 类型与当前列表不匹配，退出外层循环
      if (!listsMatch(itemMarker, initialMarker)) {
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
        listLooseFromBlankBetweenItems = true;
      }

      hadBlankLineBetweenItems = false;
      i++;

      let itemHadBlankLine = false;
      let seenNestedMarkerInItem = false;
      let deepestNestedContentStartCol = itemMarker.contentStartCol;
      let inFence = false;
      let fenceChar = "";

      ({ inFence, fenceChar } = updateFenceState(firstContent, inFence, fenceChar));

      // 消费 List Item 的内部行
      while (i < lines.length) {
        const currentLine = lines[i];

        // A. 遇到空行
        if (isBlankString(currentLine)) {
          if (!inFence) {
            if (!seenNestedMarkerInItem) {
              itemHadBlankLine = true;
            } else {
              const nextIndent = getNextNonBlankIndent(lines, i + 1);
              // GFM #305：空行在嵌套 sublist 之后、同级内容之前，仍算本 item 内空行
              if (nextIndent !== null && nextIndent < deepestNestedContentStartCol) {
                itemHadBlankLine = true;
              }
            }
          }
          itemLines.push("");
          itemLength += currentLine.length;
          i++;
          // GFM #258：空 marker 后至多一行空行，再遇到空行则结束 item
          if (itemMarker.isBlank) {
            hadBlankLineBetweenItems = true;
            break;
          }
          continue;
        }

        // B. 遇到新的 Marker
        const nextMarker = getListMarkerInfo(currentLine, { allowIndented: true });
        if (nextMarker) {
          if (
            listsMatch(nextMarker, initialMarker)
            && nextMarker.indent > initialMarker.indent
          ) {
            seenNestedMarkerInItem = true;
            deepestNestedContentStartCol = Math.max(
              deepestNestedContentStartCol,
              nextMarker.contentStartCol,
            );
          }
          if (listsMatch(nextMarker, initialMarker) && nextMarker.indent <= initialMarker.indent) {
            break;
          }
          if (!listsMatch(nextMarker, initialMarker) && getIndent(currentLine) < itemMarker.contentStartCol) {
            break;
          }
        }

        // B-2. 非强打断块：缩进足够时仍不得收进行缓冲
        if (
          getIndent(currentLine) >= itemMarker.contentStartCol
          && !getListMarkerInfo(currentLine, { allowIndented: true })
          && ctx.canStrongBreak(lines, i, false)
        ) {
          break;
        }

        // C. 检查缩进（Tab 按 4 列制表位计入视觉列）
        if (getIndent(currentLine) >= itemMarker.contentStartCol) {
          itemLength += currentLine.length;
          const slice = expandLinePrefixTabs(currentLine).slice(itemMarker.contentStartCol);
          itemLines.push(slice);
          ({ inFence, fenceChar } = updateFenceState(slice, inFence, fenceChar));
          i++;
          continue;
        }

        // C-2. 缩进不足，尝试惰性延续 (Lazy Continuation)
        // 空行之后不允许 lazy continue（GFM #233 / #254 / #238）
        if (itemHadBlankLine) {
          break;
        }

        // 规则 1：强块级起点打断（4 空格缩进行除外，见 GFM #269）
        if (ctx.canStrongBreak(lines, i) && !isIndentedCodeLine(currentLine)) {
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

      // 列表项内部仍含空行 → 仅该 item loose（GFM #287 / #299）
      const itemLoose = itemHadBlankLine && itemLines.some((l) => isBlankString(l));

      const itemChildren = ctx.parseBlocks(itemLines);
      listItems.push(createNode("list_item", itemLength, undefined, itemChildren, { loose: itemLoose }));
      length += itemLength;
    }

    const node = createNode("list", length, undefined, listItems, {
      ordered: initialMarker.isOrdered,
      start: initialMarker.start,
      bulletChar: initialMarker.bulletChar,
      delimiter: initialMarker.delimiter,
      looseFromBetween: listLooseFromBlankBetweenItems,
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
    const listLooseFromBetween = props.looseFromBetween as boolean;
    const anyItemLoose = (node.children || []).some((item) => item.props?.loose);
    const listLoose = listLooseFromBetween || anyItemLoose;

    const itemsHtml = (node.children || [])
        .map((item) => this.renderListItem(item, ctx, listLoose))
        .join("\n");

    return `<${tag}${startAttr}>\n${itemsHtml}\n</${tag}>`;
  }
}

export default new ListBlockParser();