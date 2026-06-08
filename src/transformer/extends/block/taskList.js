/**
 * @file 块级语法拓展：扩展任务列表
 * @module transformer/extends/block/taskList
 *
 * 在 GFM 任务列表基础上支持扩展状态标记（如 `[!]`、`[>]` 等）。
 * priority > list，首行含任务标记时接管，否则交还 GFM list parser。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import listParser from "@/transformer/gfm/block/list.js";
import {
  expandLinePrefixTabs,
  listsMatch,
  parseListMarkerLine,
} from "@/transformer/utils/tabs.js";

/** 任务标记字符 → 状态与 checked 映射 */
const TASK_MARKER_CHARS = {
  " ": { state: "todo", checked: false },
  x: { state: "done", checked: true },
  X: { state: "done", checked: true },
  "/": { state: "in_progress", checked: false },
  ">": { state: "migrated", checked: false },
  "<": { state: "scheduled", checked: false },
  "-": { state: "cancelled", checked: false },
  "!": { state: "urgent", checked: false },
};

/** 列表项内任务标记：`[ ]`、`[x]` 等 */
const TASK_MARKER_RE = /^(\s*)\[([ xX/><!\-])\]([ \t]+)/;

/**
 * 解析列表项内容中的任务标记。
 *
 * @param {string} text
 * @returns {{ rest: string, state: string, checked: boolean } | null}
 */
function parseTaskListMarker(text) {
  const match = text.match(TASK_MARKER_RE);
  if (!match) return null;

  const mapping = TASK_MARKER_CHARS[match[2]];
  if (!mapping) return null;

  return {
    rest: text.slice(match[0].length),
    state: mapping.state,
    checked: mapping.checked,
  };
}

/**
 * 渲染任务复选框 HTML。
 *
 * @param {{ state: string, checked: boolean }} task
 * @returns {string}
 */
function renderTaskCheckbox(task) {
  const checked = task.checked ? ' checked=""' : "";
  const extended = task.state !== "todo" && task.state !== "done";
  const stateAttr = extended ? ` data-task-state="${task.state}"` : "";
  const cls = extended
    ? ` class="task-checkbox task-checkbox-${task.state}"`
    : "";
  return `<input${checked} disabled="" type="checkbox"${stateAttr}${cls}>`;
}

/**
 * 生成任务列表项 `<li>` 的属性字符串。
 *
 * @param {{ state: string }} task
 * @returns {string}
 */
function taskListItemAttrs(task) {
  return ` class="task-list-item task-list-item-${task.state}" data-task-state="${task.state}"`;
}

/**
 * 判断当前行是否为任务列表起始行。
 *
 * @param {string} line
 * @returns {boolean}
 */
function isTaskListStart(line) {
  const marker = parseListMarkerLine(line);
  if (!marker || marker.ordered) return false;
  return !!parseTaskListMarker(expandLinePrefixTabs(marker.content));
}

/**
 * 用新内容替换列表 marker 行中的 item 文本部分。
 *
 * @param {string} line
 * @param {ReturnType<typeof parseListMarkerLine>} marker
 * @param {string} content
 * @returns {string}
 */
function rebuildMarkerLine(line, marker, content) {
  return line.slice(0, marker.contentOffset) + content;
}

/**
 * 剥离列表段内各 item 的任务标记，并收集任务状态。
 *
 * @param {string[]} lines
 * @param {number} start
 * @param {number} end
 * @returns {{ section: string[], tasks: Array<{ state: string, checked: boolean } | undefined> }}
 */
function stripTaskMarkers(lines, start, end) {
  const initial = parseListMarkerLine(lines[start]);
  const tasks = [];
  const section = lines.slice(start, end);
  let itemIndex = 0;

  for (let i = 0; i < section.length; i++) {
    const marker = parseListMarkerLine(section[i]);
    if (
      !marker ||
      !listsMatch(initial, marker) ||
      marker.markerColumn !== initial.markerColumn
    ) {
      continue;
    }

    const parsed = parseTaskListMarker(expandLinePrefixTabs(marker.content));
    if (parsed) {
      tasks[itemIndex] = { state: parsed.state, checked: parsed.checked };
      section[i] = rebuildMarkerLine(section[i], marker, parsed.rest);
    }
    itemIndex += 1;
  }

  return { section, tasks };
}

/**
 * 将任务状态附加到 list 节点及其 list_item 子节点。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} node
 * @param {Array<{ state: string, checked: boolean } | undefined>} tasks
 */
function attachTasks(node, tasks) {
  node.isTaskList = true;
  for (let i = 0; i < node.children.length; i += 1) {
    const task = tasks[i];
    if (task) {
      node.children[i].task = task;
    }
  }
}

/**
 * 渲染单个任务列表项。
 *
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} item
 * @param {import('@/transformer/core/ParserContext.js').RenderContext} ctx
 * @param {boolean} isLoose
 * @returns {string}
 */
function renderTaskItem(item, ctx, isLoose) {
  const task = item.task;
  const checkbox = task ? `${renderTaskCheckbox(task)} ` : "";
  const liAttrs = task ? taskListItemAttrs(task) : "";

  if (item.children.length === 0) {
    return `<li${liAttrs}>${checkbox}</li>`;
  }

  if (isLoose) {
    const parts = item.children.map((child, childIndex) => {
      if (childIndex === 0 && task && child.type === "paragraph") {
        return `<p>${checkbox}${ctx.renderInline(child.children)}</p>`;
      }
      return ctx.renderBlock([child]).replace(/\n$/, "");
    });
    return `<li${liAttrs}>\n${parts.join("\n")}\n</li>`;
  }

  if (item.children.length === 1) {
    const child = item.children[0];
    if (child.type === "paragraph") {
      return `<li${liAttrs}>${checkbox}${ctx.renderInline(child.children)}</li>`;
    }
    return `<li${liAttrs}>\n${checkbox}${ctx.renderBlock(item.children)}\n</li>`;
  }

  const parts = item.children.map((child, index) => {
    const prefix = index === 0 ? checkbox : "";
    if (child.type === "paragraph") {
      return `${prefix}${ctx.renderInline(child.children)}`;
    }
    return ctx.renderBlock([child]).replace(/\n$/, "");
  });

  const lead = item.children[0].type !== "paragraph" ? "\n" : "";
  const tail =
    item.children[item.children.length - 1].type === "paragraph" ? "" : "\n";
  return `<li${liAttrs}>${lead}${parts.join("\n")}${tail}</li>`;
}

/**
 * 扩展任务列表块解析器（包装 GFM list parser）。
 *
 * @extends {BaseBlockParser}
 */
class TaskListBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "list", priority: 55 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    if (!isTaskListStart(lines[index])) {
      return listParser.parse(lines, index, ctx);
    }

    const probe = listParser.parse(lines, index, ctx);
    if (!probe) return null;

    const { section, tasks } = stripTaskMarkers(lines, index, probe.nextIndex);
    const patched = [...lines.slice(0, index), ...section, ...lines.slice(probe.nextIndex)];
    const result = listParser.parse(patched, index, ctx);
    if (!result) return null;

    attachTasks(result.node, tasks);
    return result;
  }

  /** @inheritdoc */
  render(node, ctx) {
    if (!node.isTaskList) {
      return listParser.render(node, ctx);
    }

    const tag = node.ordered ? "ol" : "ul";
    const startAttr =
      node.ordered && node.start !== 1
        ? ` start="${node.start}"`
        : "";
    const isLoose = node.loose;
    const itemsHtml = node.children
      .map((item) => renderTaskItem(item, ctx, isLoose))
      .join("\n");

    return `<${tag}${startAttr}>\n${itemsHtml}\n</${tag}>`;
  }
}

export default new TaskListBlockParser();
