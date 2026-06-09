/**
 * @file 块级语法拓展：Detail 手风琴
 * @module transformer/extends/block/detail
 *
 * 语法示例：
 * ```
 * ++ 标题
 * 内容
 * +++
 * ```
 *
 * 使用 `++-` 表示默认折叠；内部可用 `++` / `++-` 子标题拆分多段。
 * 渲染为原生 `<details>`，不依赖 JavaScript。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";

/** 手风琴开标记行：`++` 或 `++-` + 标题 */
const OPEN_RE = /^ {0,3}\+\+([+-]?)\s+(.+?)\s*$/;

/** 手风琴闭标记行：`+++` */
const CLOSE_RE = /^ {0,3}\+\+\+\s*$/;

/** 内部子段标题行：`++` / `++-` + 标题（排除 `+++`） */
const SUB_HEAD_RE = /^ {0,3}\+\+(?!\+)(-?)\s+(.+?)\s*$/;


/**
 * 将内部行拆分为多个手风琴段。
 *
 * @param {string[]} innerLines
 * @param {string} outerOpen - 外层开标记的 `+`/`-` 符号
 * @param {string} outerTitle - 外层标题文本
 * @returns {Array<{ open: boolean, title: string, contentLines: string[] }>}
 */
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

/**
 * Detail 手风琴块解析器。
 *
 * @extends {BaseBlockParser}
 */
class DetailBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "detail", priority: 88 });
  }

  /** @inheritdoc */
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
      const innerChildren = ctx.parseBlocks(normalizeInnerLines(section.contentLines));
      return createNode("detail_item", {
        open: section.open,
        title: section.title,
        titleNodes: section.title
          ? ctx.parseInline(section.title)
          : [],
        children: innerChildren,
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

  /** @inheritdoc */
  render(node, ctx) {
    const items = node.children ?? [];
    if (items.length === 0) return "";

    const wrapperClass = node.multiple
      ? "cherry-detail cherry-detail__multiple"
      : "cherry-detail cherry-detail__single";

    const parts = items.map((item) => {
      const openAttr = item.open ? " open" : "";
      const summary = ctx.renderInline(item.titleNodes);
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
