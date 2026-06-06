/**
 * 块级语法：列表 (List & List Item)
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { parseListMarkerLine, listsMatch, getIndent, expandLinePrefixTabs, isIndentedCodeLine } from "@/transformer/utils/tabs.js";
import { isThematicBreakLine } from "@/transformer/gfm/block/hr.js";

const CODE_INDENT = 4;

/**
 * 判断后续 list marker 相对当前 item 是同级、嵌套，还是非 list（如 Example 292 的 `- e`）
 * @returns {'sibling'|'nested'|null}
 */
function classifyListMarkerLine(line, itemMarkerColumn, contentStartCol, initialMarker) {
  const m = parseListMarkerLine(line, { allowIndented: true });
  if (!m || !listsMatch(initialMarker, m)) return null;
  if (m.markerColumn <= itemMarkerColumn) return "sibling";
  if (m.markerColumn >= contentStartCol) return "nested";
  if (m.markerColumn >= CODE_INDENT) return null;
  return "sibling";
}

/** item 内空行是否构成 loose（排除 tight 的 paragraph + sublist） */
function isLooseListItemContent(children, itemLines) {
  if (!itemLines.some((l) => l.trim() === "")) return false;
  if (children.length <= 1) return false;

  if (
    children.length === 2 &&
    children[0].type === "paragraph" &&
    children[1].type === "list"
  ) {
    const listLineIdx = itemLines.findIndex((l) =>
      parseListMarkerLine(l, { allowIndented: true }),
    );
    if (
      listLineIdx > 0 &&
      !itemLines.slice(0, listLineIdx).some((l) => l.trim() === "")
    ) {
      return false;
    }
  }

  return true;
}

/** marker 行本身无内容（如 `-`、`*`、`2.`） */
function isEmptyMarkerLine(marker) {
  return marker.content.trim() === "";
}

/** 空 list item 或 start≠1 的有序列表不能打断段落（Example 263、284） */
function wouldInterruptParagraph(lines, index, marker) {
  if (index === 0 || lines[index - 1]?.trim() === "") return false;
  if (parseListMarkerLine(lines[index - 1])) return false;

  if (isEmptyMarkerLine(marker)) return true;
  if (marker.ordered && marker.start !== 1) return true;
  return false;
}

class ListBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "list", priority: 50 });
  }

  parse(lines, index, ctx) {
    let currentLineIndex = index;
    const initialMarker = parseListMarkerLine(lines[currentLineIndex]);
    if (!initialMarker) return null;
    if (wouldInterruptParagraph(lines, currentLineIndex, initialMarker)) return null;

    const listItems = [];
    let loose = false;
    const isOrdered = initialMarker.ordered;
    const bulletChar = initialMarker.bulletChar;
    const delimiter = initialMarker.delimiter;
    const start = initialMarker.start;
    let lastContentStartCol = initialMarker.contentStartCol;

    while (currentLineIndex < lines.length) {
      if (listItems.length > 0) {
        let peek = currentLineIndex;
        let hadBlankBetween = false;
        let foundSibling = false;

        while (peek < lines.length) {
          while (peek < lines.length && lines[peek].trim() === "") {
            hadBlankBetween = true;
            peek++;
          }
          if (peek >= lines.length) break;

          const nextItemMarker = parseListMarkerLine(lines[peek]);
          if (
            nextItemMarker &&
            listsMatch(initialMarker, nextItemMarker) &&
            nextItemMarker.markerColumn < lastContentStartCol
          ) {
            foundSibling = true;
            if (hadBlankBetween) loose = true;
            currentLineIndex = peek;
            break;
          }

          let skipped = false;
          for (const parser of ctx.registry.getBlockParsers()) {
            if (parser.type !== "linkReferenceDef") continue;
            const result = parser.parse(lines, peek, ctx);
            if (result) {
              peek = result.nextIndex;
              skipped = true;
              break;
            }
          }
          if (skipped) continue;

          break;
        }

        if (!foundSibling) break;
      }

      if (currentLineIndex >= lines.length) break;

      const line = lines[currentLineIndex];
      const marker = parseListMarkerLine(line);

      if (!marker || !listsMatch(initialMarker, marker)) break;
      if (isThematicBreakLine(line)) break;

      const itemMarkerColumn = marker.markerColumn;
      const itemLines = [];
      const contentStartCol = marker.contentStartCol;
      lastContentStartCol = contentStartCol;

      const expandedFirst = expandLinePrefixTabs(line);
      const markerContent = expandedFirst.slice(contentStartCol);
      const markerLineEmpty = markerContent.trim() === "";
      itemLines.push(markerContent);
      currentLineIndex++;

      while (currentLineIndex < lines.length) {
        const nextLine = lines[currentLineIndex];
        const indent = getIndent(nextLine);
        const isBlank = nextLine.trim() === "";

        // 空 marker 后紧跟空行：item 为空，后续内容不属于本 item（Example 258）
        if (isBlank && markerLineEmpty && itemLines.every((l) => l.trim() === "")) {
          break;
        }

        const anyMarker = parseListMarkerLine(nextLine, { allowIndented: true });
        if (anyMarker && anyMarker.markerColumn <= itemMarkerColumn) {
          break;
        }
        if (
          anyMarker &&
          !listsMatch(initialMarker, anyMarker) &&
          anyMarker.markerColumn < contentStartCol
        ) {
          break;
        }

        const markerRole = classifyListMarkerLine(
          nextLine,
          itemMarkerColumn,
          contentStartCol,
          initialMarker,
        );
        if (markerRole === "sibling") break;

        if (indent >= contentStartCol) {
          const expanded = expandLinePrefixTabs(nextLine);
          const sliceCol = isIndentedCodeLine(nextLine)
            ? Math.max(contentStartCol, indent - CODE_INDENT)
            : contentStartCol;
          itemLines.push(expanded.slice(sliceCol));
          currentLineIndex++;
        } else if (isBlank) {
          let nextNonBlank = currentLineIndex + 1;
          while (nextNonBlank < lines.length && lines[nextNonBlank].trim() === "") {
            nextNonBlank++;
          }
          if (nextNonBlank >= lines.length) {
            itemLines.push("");
            currentLineIndex++;
          } else {
            const nbLine = lines[nextNonBlank];
            let isBetweenItemsDef = false;
            for (const parser of ctx.registry.getBlockParsers()) {
              if (parser.type !== "linkReferenceDef") continue;
              if (parser.parse(lines, nextNonBlank, ctx)) {
                isBetweenItemsDef = true;
                break;
              }
            }
            if (isBetweenItemsDef) {
              loose = true;
              break;
            }
            if (getIndent(nbLine) >= contentStartCol) {
              itemLines.push("");
              currentLineIndex++;
            } else {
              break;
            }
          }
        } else {
          const content = nextLine.replace(/^ {0,3}/, "");
          const lastIdx = itemLines.length - 1;
          if (lastIdx >= 0 && itemLines[lastIdx].trim() !== "") {
            itemLines[lastIdx] += "\n" + content;
          } else {
            itemLines.push(content);
          }
          currentLineIndex++;
        }
      }

      const itemAst = ctx.parse(itemLines);

      if (isLooseListItemContent(itemAst.children, itemLines)) {
        loose = true;
      }

      listItems.push(createNode("list_item", { children: itemAst.children }));
    }

    const node = createNode(this.type, {
      children: listItems,
      ordered: isOrdered,
      start: start,
      bulletChar: bulletChar,
      delimiter: delimiter,
      loose,
    });

    return { node, nextIndex: currentLineIndex };
  }

  renderListItem(item, ctx, isLoose) {
    if (item.children.length === 0) {
      return "<li></li>";
    }

    if (isLoose) {
      const innerHtml = ctx.renderBlock(item.children);
      return `<li>\n${innerHtml}\n</li>`;
    }

    if (item.children.length === 1) {
      const child = item.children[0];
      if (child.type === "paragraph") {
        return `<li>${ctx.renderInline(child.children)}</li>`;
      }
      const innerHtml = ctx.renderBlock(item.children);
      return `<li>\n${innerHtml}\n</li>`;
    }

    const parts = item.children.map((child) => {
      if (child.type === "paragraph") {
        return ctx.renderInline(child.children);
      }
      return ctx.renderBlock([child]).replace(/\n$/, "");
    });

    const lead = item.children[0].type !== "paragraph" ? "\n" : "";
    const tail =
      item.children[item.children.length - 1].type === "paragraph" ? "" : "\n";
    return `<li>${lead}${parts.join("\n")}${tail}</li>`;
  }

  render(node, ctx) {
    const tag = node.props.ordered ? "ol" : "ul";
    const startAttr =
      node.props.ordered && node.props.start !== 1 ? ` start="${node.props.start}"` : "";
    const isLoose = node.props.loose;

    const itemsHtml = node.children
      .map((item) => this.renderListItem(item, ctx, isLoose))
      .join("\n");

    return `<${tag}${startAttr}>\n${itemsHtml}\n</${tag}>`;
  }
}

export default new ListBlockParser();
