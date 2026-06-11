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
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";

/** 选项卡开标记行：`::: tabs` */
const OPEN_RE = /^ {0,3}:::(?!:)\s+tabs\s*$/;

/** 选项卡闭标记行：`:::` */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 嵌套三冒号容器开标记（排除四冒号块） */
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;

/** 选项卡标题行：`@tab` 或 `@tab:active` + 可选标题 */
const TAB_HEAD_RE = /^@tab(:active)?(?:\s+(.*))?$/;

/** 全局选项卡组序号，用于生成唯一 radio name / id */
let tabGroupSeq = 0;

/**
 * 读取选项卡块内部行，正确处理嵌套 `:::` 容器。
 *
 * @param {string[]} lines
 * @param {number} start
 * @returns {{ innerLines: string[], nextIndex: number } | null}
 */
function readTabsInnerLines(lines, start) {
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
 * 将内部行拆分为多个选项卡段。
 *
 * @param {string[]} lines
 * @returns {Array<{ active: boolean, title: string, contentLines: string[] }>}
 */
function parseTabSections(lines) {
  const sections = [];
  let current = null;

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

/**
 * 确定默认激活的选项卡索引。
 *
 * @param {Array<{ active: boolean }>} tabs
 * @returns {number}
 */
function resolveActiveIndex(tabs) {
  const marked = tabs.findIndex((tab) => tab.active);
  return marked === -1 ? 0 : marked;
}

/**
 * 生成下一个选项卡组 id 前缀。
 *
 * @returns {string}
 */
function nextGroupId() {
  tabGroupSeq += 1;
  return `cherry-tabs-${tabGroupSeq}`;
}

/**
 * 选项卡块解析器。
 *
 * @extends {BaseBlockParser}
 */
class TabsBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "tabs", priority: 87 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    if (!OPEN_RE.test(line)) return null;

    const block = readTabsInnerLines(lines, index + 1);
    if (!block) return null;

    const sections = parseTabSections(normalizeInnerLines(block.innerLines));
    if (sections.length === 0) return null;

    const activeIndex = resolveActiveIndex(sections);
    const tabs = sections.map((section, tabIndex) => {
      const innerChildren = ctx.parseBlocks(normalizeInnerLines(section.contentLines));
      return createNode("tab_item", {
        active: tabIndex === activeIndex,
        title: section.title,
        titleNodes: section.title
          ? ctx.parseInline(section.title)
          : [],
        children: innerChildren,
      });
    });

    return {
      node: createNode(this.type, { children: tabs }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const tabs = node.children ?? [];
    if (tabs.length === 0) return "";

    const groupId = nextGroupId();
    const inputs = [];
    const labels = [];
    const panels = [];

    tabs.forEach((tab, index) => {
      const inputId = `${groupId}-${index}`;
      const checked = tab.active ? " checked" : "";
      inputs.push(
        `<input type="radio" class="cherry-tabs__radio" name="${groupId}" id="${inputId}"${checked}>`,
      );
      labels.push(
        `<label class="cherry-tabs__label" for="${inputId}">${ctx.renderInline(tab.titleNodes)}</label>`,
      );
      panels.push(
        `<div class="cherry-tabs__panel">${ctx.renderBlock(tab.children)}</div>`,
      );
    });

    return [
      `<div class="cherry-tabs">`,
      inputs.join(""),
      `<div class="cherry-tabs__nav">${labels.join("")}</div>`,
      `<div class="cherry-tabs__panels">${panels.join("")}</div>`,
      "</div>",
    ].join("\n");
  }
}

export default new TabsBlockParser();
