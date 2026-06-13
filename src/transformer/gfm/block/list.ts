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

import { canGenericLazyContinue } from "@/transformer/utils/lazyContinuation.js";
import {isBlankString} from "@/transformer/utils/normalize";

interface ListMarkerInfo {
  isOrdered: boolean;
  bulletChar?: string;
  delimiter?: string;
  start?: number;
  indent: number;       // 前置缩进 (0-3)
  contentStart: number; // 文本内容真实开始的索引
  isBlank: boolean;     // 标记后是否全为空白
}

/**
 * 提取 List 标记，返回列表属性及内容的起始索引。
 * * 采用纯游标遍历，不使用正则表达式。
 */
function getListMarkerInfo(line: string): ListMarkerInfo | null {
  let i = 0;
  let spaceCount = 0;

  // 1. 跳过最多 3 个前导空格
  while (i < line.length && line[i] === ' ' && spaceCount < 3) {
    spaceCount++;
    i++;
  }

  if (i >= line.length) return null;

  const indent = spaceCount;
  const char = line[i];
  let isOrdered = false;
  let bulletChar: string | undefined;
  let delimiter: string | undefined;
  let start: number | undefined;

  // 2. 检查无序列表 marker
  if (char === '-' || char === '*' || char === '+') {
    bulletChar = char;
    i++;
  }
  // 3. 检查有序列表 marker
  else if (char >= '0' && char <= '9') {
    isOrdered = true;
    let startStr = "";
    while (i < line.length && line[i] >= '0' && line[i] <= '9') {
      startStr += line[i];
      i++;
    }
    // 规范：数字不能超过 9 位
    if (startStr.length === 0 || startStr.length > 9) return null;

    if (i < line.length && (line[i] === '.' || line[i] === ')')) {
      delimiter = line[i];
      start = parseInt(startStr, 10);
      i++;
    } else {
      return null;
    }
  } else {
    return null;
  }

  // 4. Marker 后必须有空格或到达行尾
  if (i < line.length && line[i] !== ' ' && line[i] !== '\t') {
    return null;
  }

  let spacesAfter = 0;
  while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
    spacesAfter++;
    i++;
  }

  // CommonMark 规范：如果 Marker 后的空格超过 4 个，视为代码缩进，内容从 Marker后第1个空格算起。
  let contentStart = i;
  if (spacesAfter > 4) {
    contentStart = i - spacesAfter + 1;
  }

  return {
    isOrdered,
    bulletChar,
    delimiter,
    start,
    indent,
    contentStart,
    isBlank: isBlankString(line.slice(contentStart))
  };
}

/**
 * 列表块解析器。
 * * 采用游标遍历，去除任何对外部具体解析器的强依赖。
 * @extends {BaseBlockParser}
 */
class ListBlockParser extends BaseBlockParser {
  constructor() {
    super("list", 50);
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
      if (itemMarker.isOrdered !== initialMarker.isOrdered ||
          itemMarker.bulletChar !== initialMarker.bulletChar ||
          itemMarker.delimiter !== initialMarker.delimiter) {
        break;
      }

      // --- 开始消费一个新的 List Item ---
      const itemLines: string[] = [];
      let itemLength = 0;

      // 剥去内容起始的缩进
      const firstLine = lines[i];
      itemLength += firstLine.length;
      itemLines.push(firstLine.slice(itemMarker.contentStart));

      if (hadBlankLineBetweenItems && listItems.length > 0) {
        isListLoose = true;
      }

      hadBlankLineBetweenItems = false;
      i++;

      // 消费 List Item 的内部行
      while (i < lines.length) {
        const currentLine = lines[i];

        // A. 遇到空行
        if (isBlankString(currentLine)) {
          itemLines.push("");
          itemLength += currentLine.length;
          i++;
          continue;
        }

        // B. 遇到新的 Marker
        const nextMarker = getListMarkerInfo(currentLine);
        if (nextMarker) {
          // 如果是一个同级别的兄弟节点，退出内层循环，让外层去收割它
          if (nextMarker.isOrdered === initialMarker.isOrdered &&
              nextMarker.bulletChar === initialMarker.bulletChar &&
              nextMarker.delimiter === initialMarker.delimiter) {
            break;
          }
          // 如果是一个不同类型的 Marker，且缩进不够，视为打断
          if (nextMarker.indent < itemMarker.contentStart) {
            break;
          }
        }

        // C. 检查缩进
        let currentIndent = 0;
        while (currentIndent < currentLine.length && currentLine[currentIndent] === ' ') {
          currentIndent++;
        }

        // C-1. 缩进足够，毫无疑问属于当前 Item
        if (currentIndent >= itemMarker.contentStart) {
          itemLength += currentLine.length;
          itemLines.push(currentLine.slice(itemMarker.contentStart));
          i++;
          continue;
        }

        // C-2. 缩进不足，尝试惰性延续 (Lazy Continuation)

        // 规则 1：先检查是否被强块级起点打断 (无缝接入你设计的上下文探针)
        if (ctx.isBlockStarter && ctx.isBlockStarter(currentLine)) {
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

      // 移除尾部多余的空行，并标记遇到了空行
      while (itemLines.length > 0 && isBlankString(itemLines[itemLines.length - 1])) {
        itemLines.pop();
        hadBlankLineBetweenItems = true;
      }

      // 如果列表项内部夹杂空行，列表变松散 (Loose)
      for (const l of itemLines) {
        if (isBlankString(l)) {
          isListLoose = true;
          break;
        }
      }

      // 一把梭解析子节点
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