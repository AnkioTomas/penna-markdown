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
 * 切换使用 radio + CSS，不依赖 JavaScript。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

/** 选项卡开标记行：`::: tabs` */
const OPEN_RE = /^ {0,3}:::(?!:)\s+tabs\s*$/;

/** 选项卡闭标记行：`:::` */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 选项卡标题行：`@tab` 或 `@tab:active` + 可选标题 */
const TAB_HEAD_RE = /^@tab(:active)?(?:\s+(.*))?$/;

/** 全局选项卡组序号，用于生成唯一 DOM id */
let tabGroupSeq = 0;

/**
 * 去掉选项卡内容首尾仅含空白的行。
 *
 * @param {string[]} lines
 * @returns {string[]}
 */
function normalizeInnerLines(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return lines.slice(start, end);
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
 * 生成下一个选项卡组 DOM id。
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

    const innerLines = [];
    let i = index + 1;

    while (i < lines.length) {
      if (CLOSE_RE.test(lines[i] ?? "")) break;
      innerLines.push(lines[i]);
      i += 1;
    }

    if (i >= lines.length) return null;

    const sections = parseTabSections(normalizeInnerLines(innerLines));
    if (sections.length === 0) return null;

    const activeIndex = resolveActiveIndex(sections);
    const tabs = sections.map((section, tabIndex) => {
      const innerAst = ctx.parse(normalizeInnerLines(section.contentLines));
      return createNode("tab_item", {
        active: tabIndex === activeIndex,
        title: section.title,
        titleNodes: section.title
          ? ctx.parseInline(section.title)
          : [],
        children: innerAst.children,
      });
    });

    return {
      node: createNode(this.type, { children: tabs }),
      nextIndex: i + 1,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const tabs = node.children ?? [];
    if (tabs.length === 0) return "";

    const groupId = nextGroupId();
    const styleRules = [];
    const inputs = [];
    const labels = [];
    const panels = [];

    tabs.forEach((tab, index) => {
      const inputId = `${groupId}-${index}`;
      const checked = tab.props.active ? " checked" : "";
      styleRules.push(
        `#${groupId} #${inputId}:checked ~ .cherry-tabs__panels > .cherry-tabs__panel:nth-child(${index + 1}) { display: block; }`,
        `#${groupId} #${inputId}:checked ~ .cherry-tabs__nav > label[for="${inputId}"] { background: var(--cherry-tabs-active-bg, #fff); border-bottom-color: var(--cherry-tabs-active-color, #3b82f6); font-weight: 600; }`,
      );
      inputs.push(
        `<input type="radio" class="cherry-tabs__radio" name="${groupId}" id="${inputId}"${checked}>`,
      );
      labels.push(
        `<label class="cherry-tabs__label" for="${inputId}">${ctx.renderInline(tab.props.titleNodes)}</label>`,
      );
      panels.push(
        `<div class="cherry-tabs__panel">${ctx.renderBlock(tab.children)}</div>`,
      );
    });

    return [
      `<div class="cherry-tabs" id="${groupId}">`,
      `<style>${styleRules.join("")}</style>`,
      inputs.join(""),
      `<div class="cherry-tabs__nav">${labels.join("")}</div>`,
      `<div class="cherry-tabs__panels">${panels.join("")}</div>`,
      "</div>",
    ].join("\n");
  }
}

export default new TabsBlockParser();
