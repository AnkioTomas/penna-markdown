/**
 * @file 块级语法拓展：折叠面板
 * @module transformer/extends/block/collapse
 *
 * 三种面板切分方式，按优先级依次尝试：
 *
 * 1. `@item` 分隔的多面板，正文是任意 Markdown：
 *    ```
 *    ::: collapse accordion
 *    @item 面板一
 *    - 列表、代码块、嵌套容器都正常
 *    @item:open 面板二
 *    默认展开
 *    :::
 *    ```
 * 2. 开标记带标题的单面板，正文是任意 Markdown：
 *    ```
 *    ::: collapse 常见问题排查
 *    - 列表、代码块、嵌套容器都正常
 *    :::
 *    ```
 * 3. `- 标题` 列表项分隔的多面板（旧写法）。`-` 与真实 Markdown 列表冲突，
 *    正文含顶层列表时会被切成多个面板，复杂内容请改用前两种。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import {
  createNode,
  type MarkdownNode,
} from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  blockLength,
  readTripleColonBlock,
} from "@/transformer/extends/block/card/shared.js";

/** 折叠面板开标记行：`::: collapse [标志] [标题]` */
const OPEN_RE = /^ {0,3}:::(?!:)\s+collapse(?:\s+(.*))?$/;

/** 三冒号闭标记行 */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 嵌套三冒号开标记（排除四冒号块） */
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;

/** 面板分隔标记行：`@item` / `@item:open` / `@item:closed` + 可选标题 */
const ITEM_HEAD_RE = /^@item(?::(open|closed))?(?:\s+(.*))?$/;

/** 旧写法的面板头：`- 标题` / `- :+ 标题` / `- :- 标题` */
const LEGACY_HEAD_RE = /^-\s+(?::([+-])\s+)?(.+)$/;

/** 开标记上标题之前的容器标志 */
const FLAG_RE = /^(accordion|expand)(?:\s+|$)/;

let collapseGroupSeq = 0;

interface CollapseContainer {
  accordion: boolean;
  expand: boolean;
  title: string;
}

interface CollapseSection {
  /** `open` / `closed` 为显式标记，空串表示跟随容器 */
  marker: string;
  titleLines: string[];
  contentLines: string[];
}

/**
 * 拆开标记行：标题前的 `accordion` / `expand` 是标志，其余是标题。
 * `accordion` 优先，同时出现时 `expand` 无效。
 */
function parseCollapseContainer(raw: string): CollapseContainer {
  let rest = String(raw ?? "").trim();
  let accordion = false;
  let expand = false;

  for (let flag = rest.match(FLAG_RE); flag; flag = rest.match(FLAG_RE)) {
    if (flag[1] === "accordion") accordion = true;
    else expand = true;
    rest = rest.slice(flag[0].length);
  }

  return { accordion, expand: expand && !accordion, title: rest.trim() };
}

function resolveItemOpen(
  container: CollapseContainer,
  marker: string,
): boolean {
  if (marker) return marker === "open";
  return container.expand;
}

/**
 * 按 `@item` 切分面板。**只在 `:::` 深度为 0 时切**，
 * 使嵌套容器内部的 `@item` 归属内层。首个 `@item` 之前的内容丢弃（与 tabs 一致）。
 */
function splitByItemHead(lines: string[]): CollapseSection[] {
  const sections: CollapseSection[] = [];
  let current: CollapseSection | null = null;
  let depth = 0;

  for (const line of lines) {
    if (depth === 0) {
      const head = line.match(ITEM_HEAD_RE);
      if (head) {
        const title = head[2]?.trim() ?? "";
        current = {
          marker: head[1] ?? "",
          titleLines: title ? [title] : [],
          contentLines: [],
        };
        sections.push(current);
        continue;
      }
    }

    if (NESTED_OPEN_RE.test(line)) depth += 1;
    else if (CLOSE_RE.test(line) && depth > 0) depth -= 1;

    if (current) current.contentLines.push(line);
  }

  return sections;
}

/**
 * 旧写法：顶层 `- 标题` 起一个面板，紧跟的非空行并入标题，空行之后是正文。
 * 面板头必须顶格，缩进的 `-` 属于正文里的嵌套列表。
 */
function splitByListItem(lines: string[]): CollapseSection[] {
  const sections: CollapseSection[] = [];
  let i = 0;

  while (i < lines.length) {
    const head = lines[i]?.match(LEGACY_HEAD_RE);
    if (!head) {
      i += 1;
      continue;
    }

    const titleLines = [head[2].trim()];
    const marker = head[1] === "+" ? "open" : head[1] ? "closed" : "";
    i += 1;

    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (LEGACY_HEAD_RE.test(line) || line.trim() === "") break;
      titleLines.push(line.trim());
      i += 1;
    }

    while (i < lines.length && (lines[i] ?? "").trim() === "") {
      i += 1;
    }

    const contentLines: string[] = [];
    while (i < lines.length && !LEGACY_HEAD_RE.test(lines[i] ?? "")) {
      contentLines.push(lines[i] ?? "");
      i += 1;
    }

    sections.push({ marker, titleLines, contentLines });
  }

  return sections;
}

function parseCollapseSections(
  lines: string[],
  container: CollapseContainer,
): CollapseSection[] {
  const items = splitByItemHead(lines);
  if (items.length > 0) return items;

  if (container.title) {
    return [{ marker: "", titleLines: [container.title], contentLines: lines }];
  }

  return splitByListItem(lines);
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
    const block = readTripleColonBlock(lines, index, OPEN_RE);
    if (!block) return null;

    const container = parseCollapseContainer(block.attrs);
    const sections = parseCollapseSections(
      normalizeInnerLines(block.innerLines),
      container,
    );
    if (sections.length === 0) return null;

    const items = sections.map((section) =>
      createNode(
        "collapse_item",
        0,
        undefined,
        ctx.parseBlocks(normalizeInnerLines(section.contentLines)),
        {
          open: resolveItemOpen(container, section.marker),
          title: section.titleLines.join("\n"),
          titleLineNodes: section.titleLines.map((item) =>
            ctx.parseInline(item),
          ),
        },
      ),
    );

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
    const groupName = accordion ? `penna-collapse-${++collapseGroupSeq}` : "";
    const containerClasses = [
      "penna-collapse",
      accordion ? "penna-collapse--accordion" : "",
      expand ? "penna-collapse--expand" : "",
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
        `<div class="penna-collapse-body">${body}</div>`,
        "</details>",
      ].join("\n");
    });

    return `<div class="${containerClasses}"${this.sourceLineAttrs(node)}>\n${parts.join("\n")}\n</div>\n`;
  }
}

export default new CollapseBlockParser();
