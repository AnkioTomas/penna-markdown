/**
 * 块级语法：列表 (List & List Item)
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { parseListMarkerLine, listsMatch, getIndent, findIndexAtColumn, expandLinePrefixTabs } from "@/transformer/utils/tabs.js";

class ListBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "list", priority: 50 });
  }

  parse(lines, index, blockParser) {
    let currentLineIndex = index;
    const initialMarker = parseListMarkerLine(lines[currentLineIndex]);
    if (!initialMarker) return null;

    const listItems = [];
    let isOrdered = initialMarker.ordered;
    let bulletChar = initialMarker.bulletChar;
    let delimiter = initialMarker.delimiter;
    let start = initialMarker.start;

    while (currentLineIndex < lines.length) {
      const line = lines[currentLineIndex];
      const marker = parseListMarkerLine(line);
      
      if (!marker || !listsMatch(initialMarker, marker)) break;

      const itemLines = [];
      const contentStartCol = marker.contentStartCol;
      
      // 第一行内容：展开后按列切割
      const expandedFirst = expandLinePrefixTabs(line);
      itemLines.push(expandedFirst.slice(contentStartCol));
      currentLineIndex++;

      while (currentLineIndex < lines.length) {
        const nextLine = lines[currentLineIndex];
        const indent = getIndent(nextLine);
        const isBlank = nextLine.trim() === "";

        const nextMarker = parseListMarkerLine(nextLine);
        if (nextMarker && listsMatch(initialMarker, nextMarker)) {
          if (nextMarker.markerColumn <= initialMarker.markerColumn) break;
        }

        let interrupted = false;
        if (!isBlank && !nextMarker) {
            for (const parser of blockParser.registry.getBlockParsers()) {
                if (parser.priority > this.priority && parser.type !== "list") {
                    if (parser.parse(lines, currentLineIndex, blockParser)) {
                        interrupted = true;
                        break;
                    }
                }
            }
        }
        if (interrupted) break;

        if (indent >= contentStartCol) {
          const expanded = expandLinePrefixTabs(nextLine);
          itemLines.push(expanded.slice(contentStartCol));
          currentLineIndex++;
        } else if (isBlank) {
            let nextNonBlank = currentLineIndex + 1;
            while (nextNonBlank < lines.length && lines[nextNonBlank].trim() === "") nextNonBlank++;
            if (nextNonBlank >= lines.length || getIndent(lines[nextNonBlank]) >= contentStartCol) {
                itemLines.push("");
                currentLineIndex++;
            } else {
                break;
            }
        } else {
          itemLines.push(nextLine.trimStart());
          currentLineIndex++;
        }
      }

      const itemAst = blockParser.parse(itemLines);
      listItems.push(createNode("list_item", { children: itemAst.children }));
    }

    const node = createNode(this.type, {
      children: listItems,
      ordered: isOrdered,
      start: start,
      bulletChar: bulletChar,
      delimiter: delimiter,
    });

    return { node, nextIndex: currentLineIndex };
  }

  render(node, renderInline, renderBlock) {
    const tag = node.props.ordered ? "ol" : "ul";
    const startAttr = (node.props.ordered && node.props.start !== 1) ? ` start="${node.props.start}"` : "";
    
    // 简单的 tight 列表逻辑：如果节点没有被标记为 loose，则尝试紧凑渲染
    const isLoose = node.props.loose;

    const itemsHtml = node.children
      .map((item) => {
        let innerHtml = "";
        if (!isLoose && item.children.length === 1 && item.children[0].type === "paragraph") {
            innerHtml = renderInline(item.children[0].children);
        } else {
            innerHtml = renderBlock(item.children);
        }
        return `<li>${innerHtml}</li>`;
      })
      .join("\n");

    return `<${tag}${startAttr}>\n${itemsHtml}\n</${tag}>`;
  }
}

export default new ListBlockParser();
