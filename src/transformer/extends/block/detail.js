/**
 * Detail 手风琴：++ 标题 / ++- 标题 ... +++
 * 渲染为原生 <details>，不依赖 JavaScript
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

const OPEN_RE = /^ {0,3}\+\+([+-]?)\s+(.+?)\s*$/;
const CLOSE_RE = /^ {0,3}\+\+\+\s*$/;
const SUB_HEAD_RE = /^ {0,3}\+\+(?!\+)(-?)\s+(.+?)\s*$/;

function normalizeInnerLines(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return lines.slice(start, end);
}

function parseDetailSections(innerLines, outerOpen, outerTitle) {
  const hasSubSections = innerLines.some((line) => SUB_HEAD_RE.test(line));
  if (!hasSubSections) {
    return [
      {
        open: outerOpen === "-",
        title: outerTitle,
        contentLines: innerLines,
      },
    ];
  }

  const sections = [];
  let current = {
    open: outerOpen === "-",
    title: outerTitle,
    contentLines: [],
  };

  for (const line of innerLines) {
    const head = line.match(SUB_HEAD_RE);
    if (head) {
      sections.push(current);
      current = {
        open: head[1] === "-",
        title: head[2].trim(),
        contentLines: [],
      };
      continue;
    }
    current.contentLines.push(line);
  }

  sections.push(current);
  return sections;
}

class DetailBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "detail", priority: 88 });
  }

  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    const open = line.match(OPEN_RE);
    if (!open) return null;

    const innerLines = [];
    let i = index + 1;

    while (i < lines.length) {
      if (CLOSE_RE.test(lines[i] ?? "")) break;
      innerLines.push(lines[i]);
      i += 1;
    }

    if (i >= lines.length) return null;

    const sections = parseDetailSections(
      normalizeInnerLines(innerLines),
      open[1],
      open[2].trim(),
    );

    const items = sections.map((section) => {
      const innerAst = ctx.parse(normalizeInnerLines(section.contentLines));
      return createNode("detail_item", {
        open: section.open,
        title: section.title,
        titleNodes: section.title
          ? ctx.parseInline(section.title)
          : [],
        children: innerAst.children,
      });
    });

    return {
      node: createNode(this.type, {
        multiple: items.length > 1,
        children: items,
      }),
      nextIndex: i + 1,
    };
  }

  render(node, ctx) {
    const items = node.children ?? [];
    if (items.length === 0) return "";

    const wrapperClass = node.props.multiple
      ? "cherry-detail cherry-detail__multiple"
      : "cherry-detail cherry-detail__single";

    const parts = items.map((item) => {
      const openAttr = item.props.open ? " open" : "";
      const summary = ctx.renderInline(item.props.titleNodes);
      const body = ctx.renderBlock(item.children);
      return [
        `<details${openAttr}>`,
        `<summary>${summary}</summary>`,
        `<div class="cherry-detail-body">${body}</div>`,
        "</details>",
      ].join("\n");
    });

    return `<div class="${wrapperClass}">\n${parts.join("\n")}\n</div>`;
  }
}

export default new DetailBlockParser();
