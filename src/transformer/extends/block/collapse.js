/**
 * @file 块级语法拓展：折叠面板
 * @module transformer/extends/block/collapse
 *
 * ```
 * ::: collapse accordion expand
 * - 标题 1
 *
 *   正文内容
 *
 * - :+ 标题 2
 *
 *   正文内容
 * :::
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";

/** 折叠面板开标记行：`::: collapse` + 容器配置 */
const OPEN_RE = /^ {0,3}:::(?!:)\s+collapse(?:\s+(.*))?$/;

/** 折叠面板闭标记行：`:::` */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 嵌套三冒号容器开标记（排除四冒号块） */
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;

/** 列表项标题行：`- 标题` / `- :+ 标题` / `- :- 标题` */
const ITEM_HEAD_RE = /^ {0,3}-\s+(?::([+-])\s+)?(.+)$/;

/** 全局折叠组序号，用于手风琴 `details name` */
let collapseGroupSeq = 0;

/**
 * @param {string} raw
 * @param {string} name
 * @returns {boolean}
 */
function hasCollapseFlag(raw, name) {
  return new RegExp(`\\b${name}\\b`).test(String(raw ?? ""));
}

/**
 * @param {string} raw
 * @returns {{ accordion: boolean, expand: boolean }}
 */
function parseCollapseContainer(raw) {
  const attrs = String(raw ?? "").trim();
  const accordion = hasCollapseFlag(attrs, "accordion");

  return {
    accordion,
    expand: !accordion && hasCollapseFlag(attrs, "expand"),
  };
}

/**
 * @param {{ accordion: boolean, expand: boolean }} container
 * @param {string} marker
 * @returns {boolean}
 */
function resolveItemOpen(container, marker) {
  if (container.accordion) {
    return marker === "+";
  }
  if (container.expand) {
    return marker !== "-";
  }
  return marker === "+";
}

/**
 * @param {string[]} lines
 * @param {number} start
 * @returns {{ innerLines: string[], nextIndex: number } | null}
 */
function readCollapseInnerLines(lines, start) {
  const innerLines = [];
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

/**
 * @param {string[]} lines
 * @returns {Array<{ marker: string, title: string, contentLines: string[] }>}
 */
function parseCollapseSections(lines) {
  /** @type {Array<{ marker: string, title: string, contentLines: string[] }>} */
  const sections = [];
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

    const contentLines = [];
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

/**
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[][]} titleLineNodes
 * @param {import('@/transformer/core/ParserContext.js').RenderContext} ctx
 * @returns {string}
 */
function renderCollapseTitle(titleLineNodes, ctx) {
  const lines = titleLineNodes ?? [];
  if (lines.length === 0) return "";
  return lines.map((nodes) => ctx.renderInline(nodes)).join("<br>");
}

/**
 * 折叠面板块解析器。
 *
 * @extends {BaseBlockParser}
 */
class CollapseBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "collapse", priority: 88 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    const open = line.match(OPEN_RE);
    if (!open) return null;

    const block = readCollapseInnerLines(lines, index + 1);
    if (!block) return null;

    const container = parseCollapseContainer(open[1] ?? "");
    const sections = parseCollapseSections(normalizeInnerLines(block.innerLines));
    if (sections.length === 0) return null;

    const items = sections.map((section) => {
      const titleLines = section.title
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      return createNode("collapse_item", {
        open: resolveItemOpen(container, section.marker),
        title: section.title,
        titleLineNodes: titleLines.map((item) => ctx.parseInline(item)),
        children: ctx.parseBlocks(normalizeInnerLines(section.contentLines)),
      });
    });

    return {
      node: createNode(this.type, {
        accordion: container.accordion,
        expand: container.expand,
        children: items,
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const items = node.children ?? [];
    if (items.length === 0) return "";

    const accordion = Boolean(node.accordion);
    const groupName = accordion ? `cherry-collapse-${++collapseGroupSeq}` : "";
    const containerClasses = [
      "cherry-collapse",
      accordion ? "cherry-collapse--accordion" : "",
      node.expand ? "cherry-collapse--expand" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const parts = items.map((item) => {
      const openAttr = item.open ? " open" : "";
      const nameAttr = groupName ? ` name="${groupName}"` : "";
      const summary = renderCollapseTitle(item.titleLineNodes, ctx);
      const body = ctx.renderBlock(item.children);

      return [
        `<details${openAttr}${nameAttr}>`,
        `<summary>${summary}</summary>`,
        `<div class="cherry-collapse-body">${body}</div>`,
        "</details>",
      ].join("\n");
    });

    return `<div class="${containerClasses}">\n${parts.join("\n")}\n</div>\n`;
  }
}

export default new CollapseBlockParser();
