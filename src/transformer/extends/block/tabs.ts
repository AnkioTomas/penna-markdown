/**
 * @file 块级语法拓展：选项卡
 * @module transformer/extends/block/tabs
 *
 * 语法示例：
 * ```
 * ::: tabs
 * @tab 标签一
 * 内容一
 * @tab:active 标签二
 * 内容二
 * :::
 * ```
 *
 * 切换使用 radio + CSS（:has），不依赖 JavaScript。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import { blockLength } from "./card/shared.js";
const OPEN_RE = /^ {0,3}:::(?!:)\s+tabs\s*$/;

/** 选项卡闭标记行：`:::` */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 嵌套三冒号容器开标记（排除四冒号块） */
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;

/** 选项卡标题行：`@tab` 或 `@tab:active` + 可选标题 */
const TAB_HEAD_RE = /^@tab(:active)?(?:\s+(.*))?$/;

/** 全局选项卡组序号，用于生成唯一 radio name / id */
let tabGroupSeq = 0;

function readTabsInnerLines(
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

function parseTabSections(lines: string[]) {
  const sections: Array<{ active: boolean; title: string; contentLines: string[] }> = [];
  let current: { active: boolean; title: string; contentLines: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const head = trimmed.match(TAB_HEAD_RE);
    if (head) {
      if (current) sections.push(current);
      current = {
        active: head[1] === ":active",
        title: head[2]?.trim() ?? "",
        contentLines: [],
      };
      continue;
    }
    if (current) current.contentLines.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

function resolveActiveIndex(tabs: Array<{ active: boolean }>): number {
  const marked = tabs.findIndex((tab) => tab.active);
  return marked === -1 ? 0 : marked;
}

function nextGroupId(): string {
  tabGroupSeq += 1;
  return `cherry-tabs-${tabGroupSeq}`;
}

class TabsBlockParser extends BaseBlockParser {
  constructor() {
    super("tabs");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    if (!OPEN_RE.test(line)) return null;

    const block = readTabsInnerLines(lines, index + 1);
    if (!block) return null;

    const sections = parseTabSections(normalizeInnerLines(block.innerLines));
    if (sections.length === 0) return null;

    const activeIndex = resolveActiveIndex(sections);
    const tabs = sections.map((section, tabIndex) => {
      const innerChildren = ctx.parseBlocks(normalizeInnerLines(section.contentLines));
      const titleNodes = section.title ? ctx.parseInline(section.title) : [];
      return createNode(
        "tab_item",
        0,
        undefined,
        innerChildren,
        {
          active: tabIndex === activeIndex,
          title: section.title,
          titleNodes,
        },
      );
    });

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        tabs,
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const tabs = node.children ?? [];
    if (tabs.length === 0) return "";

    const groupId = nextGroupId();
    const labels: string[] = [];
    const panels: string[] = [];

    tabs.forEach((tab, index) => {
      const active = Boolean(tab.props?.active);
      const titleNodes = (tab.props?.titleNodes as MarkdownNode[] | undefined) ?? [];
      const checked = active ? " checked" : "";
      labels.push(
        `<label class="cherry-tabs__label">` +
          `<input type="radio" class="cherry-tabs__radio" name="${groupId}"${checked}>` +
          `${ctx.renderInline(titleNodes)}` +
          `</label>`,
      );
      panels.push(
        `<div class="cherry-tabs__panel">${ctx.renderBlock(tab.children ?? [])}</div>`,
      );
    });

    return [
      `<div class="cherry-tabs"${this.sourceLineAttrs(node)}>`,
      `<div class="cherry-tabs__nav">${labels.join("")}</div>`,
      `<div class="cherry-tabs__panels">${panels.join("")}</div>`,
      "</div>",
    ].join("\n");
  }
}

export default new TabsBlockParser();
