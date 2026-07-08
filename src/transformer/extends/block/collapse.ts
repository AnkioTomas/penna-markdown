/**
 * @file 块级语法拓展：折叠面板
 * @module transformer/extends/block/collapse
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import {
  createNode,
  type MarkdownNode,
} from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import { blockLength } from "@/transformer/extends/block/card/shared";

const OPEN_RE = /^ {0,3}:::(?!:)\s+collapse(?:\s+(.*))?$/;
const CLOSE_RE = /^ {0,3}:::\s*$/;
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;
const ITEM_HEAD_RE = /^ {0,3}-\s+(?::([+-])\s+)?(.+)$/;

let collapseGroupSeq = 0;

function hasCollapseFlag(raw: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`).test(String(raw ?? ""));
}

function parseCollapseContainer(raw: string) {
  const attrs = String(raw ?? "").trim();
  const accordion = hasCollapseFlag(attrs, "accordion");

  return {
    accordion,
    expand: !accordion && hasCollapseFlag(attrs, "expand"),
  };
}

function resolveItemOpen(
  container: { accordion: boolean; expand: boolean },
  marker: string,
): boolean {
  if (container.accordion) {
    return marker === "+";
  }
  if (container.expand) {
    return marker !== "-";
  }
  return marker === "+";
}

function readCollapseInnerLines(
  lines: string[],
  start: number,
): { innerLines: string[]; nextIndex: number } | null {
  const innerLines: string[] = [];
  let depth = 0;
  let i = start;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (CLOSE_RE.test(line)) {
      if (depth === 0) {
        return { innerLines, nextIndex: i + 1 };
      }
      depth -= 1;
      innerLines.push(line);
      i += 1;
      continue;
    }

    if (NESTED_OPEN_RE.test(line)) {
      depth += 1;
    }

    innerLines.push(line);
    i += 1;
  }

  return null;
}

function parseCollapseSections(lines: string[]) {
  const sections: Array<{
    marker: string;
    title: string;
    contentLines: string[];
  }> = [];
  let i = 0;

  while (i < lines.length) {
    const head = lines[i]?.match(ITEM_HEAD_RE);
    if (!head) {
      i += 1;
      continue;
    }

    const titleLines = [head[2].trim()];
    const marker = head[1] ?? "";
    i += 1;

    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (ITEM_HEAD_RE.test(line)) break;
      if (line.trim() === "") break;
      titleLines.push(line.trim());
      i += 1;
    }

    while (i < lines.length && (lines[i] ?? "").trim() === "") {
      i += 1;
    }

    const contentLines: string[] = [];
    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (ITEM_HEAD_RE.test(line)) break;
      contentLines.push(line);
      i += 1;
    }

    sections.push({
      marker,
      title: titleLines.join("\n"),
      contentLines,
    });
  }

  return sections;
}

function renderCollapseTitle(
  titleLineNodes: MarkdownNode[][],
  ctx: RenderContext,
): string {
  const lines = titleLineNodes ?? [];
  if (lines.length === 0) return "";
  return lines.map((nodes) => ctx.renderInline(nodes)).join("<br>");
}

class CollapseBlockParser extends BaseBlockParser {
  constructor() {
    super("collapse");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    const open = line.match(OPEN_RE);
    if (!open) return null;

    const block = readCollapseInnerLines(lines, index + 1);
    if (!block) return null;

    const container = parseCollapseContainer(open[1] ?? "");
    const sections = parseCollapseSections(
      normalizeInnerLines(block.innerLines),
    );
    if (sections.length === 0) return null;

    const items = sections.map((section) => {
      const titleLines = section.title
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      return createNode(
        "collapse_item",
        0,
        undefined,
        ctx.parseBlocks(normalizeInnerLines(section.contentLines)),
        {
          open: resolveItemOpen(container, section.marker),
          title: section.title,
          titleLineNodes: titleLines.map((item) => ctx.parseInline(item)),
        },
      );
    });

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        items,
        {
          accordion: container.accordion,
          expand: container.expand,
        },
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const items = node.children ?? [];
    if (items.length === 0) return "";

    const accordion = Boolean(node.props?.accordion);
    const expand = Boolean(node.props?.expand);
    const groupName = accordion ? `cherry-collapse-${++collapseGroupSeq}` : "";
    const containerClasses = [
      "cherry-collapse",
      accordion ? "cherry-collapse--accordion" : "",
      expand ? "cherry-collapse--expand" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const parts = items.map((item) => {
      const open = Boolean(item.props?.open);
      const titleLineNodes =
        (item.props?.titleLineNodes as MarkdownNode[][] | undefined) ?? [];
      const openAttr = open ? " open" : "";
      const nameAttr = groupName ? ` name="${groupName}"` : "";
      const summary = renderCollapseTitle(titleLineNodes, ctx);
      const body = ctx.renderBlock(item.children ?? []);

      return [
        `<details${openAttr}${nameAttr}>`,
        `<summary>${summary}</summary>`,
        `<div class="cherry-collapse-body">${body}</div>`,
        "</details>",
      ].join("\n");
    });

    return `<div class="${containerClasses}"${this.sourceLineAttrs(node)}>\n${parts.join("\n")}\n</div>\n`;
  }
}

export default new CollapseBlockParser();
