/**
 * @file 块级语法拓展：扩展任务列表
 * @module transformer/extends/block/taskList
 *
 * priority 316 > list(315)，接管列表解析。
 * 行内解析前在块级剥离 `[ ]` 等任务标记，无需额外 inline parser。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import listParser from "@/transformer/gfm/block/list.js";
import {
  expandLinePrefixTabs,
  listsMatch,
  parseListMarkerLine,
} from "@/transformer/utils/tabs.js";

/** 任务标记字符 → 状态与 checked 映射 */
const TASK_MARKER_CHARS: Record<string, { state: string; checked: boolean }> = {
  " ": { state: "todo", checked: false },
  x: { state: "done", checked: true },
  X: { state: "done", checked: true },
  "/": { state: "in_progress", checked: false },
  ">": { state: "migrated", checked: false },
  "<": { state: "scheduled", checked: false },
  "-": { state: "cancelled", checked: false },
  "!": { state: "urgent", checked: false },
};

/** 任务状态 → 无障碍标签 */
const TASK_ARIA_LABELS: Record<string, string> = {
  todo: "To-do",
  done: "Done",
  in_progress: "In progress",
  migrated: "Migrated",
  scheduled: "Scheduled",
  cancelled: "Cancelled",
  urgent: "Urgent",
};

/** 任务状态 → HTML class */
const TASK_STATE_CLASS: Record<string, string> = {
  in_progress: "progress",
};

interface TaskInfo {
  state: string;
  checked: boolean;
}

const TASK_MARKER_IN_CONTENT = /^(\s*)\[([ xX/><!\-])\]([ \t]+)/;

function taskStateClass(state: string): string {
  return TASK_STATE_CLASS[state] ?? state;
}

function parseTaskMarkerInContent(content: string): TaskInfo | null {
  const match = content.match(TASK_MARKER_IN_CONTENT);
  if (!match) return null;
  const mapping = TASK_MARKER_CHARS[match[2]];
  if (!mapping) return null;
  return { state: mapping.state, checked: mapping.checked };
}

function isTaskListStart(line: string): boolean {
  const marker = parseListMarkerLine(line, { allowIndented: true });
  if (!marker || marker.ordered) return false;
  return (
    parseTaskMarkerInContent(expandLinePrefixTabs(marker.content)) !== null
  );
}

/** 从列表 marker 行 content 区剥离任务标记，返回新行 */
function stripTaskMarkerFromMarkerLine(line: string): {
  line: string;
  task: TaskInfo | null;
} {
  const marker = parseListMarkerLine(line, { allowIndented: true });
  if (!marker || marker.ordered) return { line, task: null };

  const content = expandLinePrefixTabs(marker.content);
  const match = content.match(TASK_MARKER_IN_CONTENT);
  if (!match) return { line, task: null };

  const mapping = TASK_MARKER_CHARS[match[2]];
  if (!mapping) return { line, task: null };

  const newLine =
    line.slice(0, marker.contentOffset) + content.slice(match[0].length);
  return {
    line: newLine,
    task: { state: mapping.state, checked: mapping.checked },
  };
}

/**
 * 在 list 块范围内剥离各行 marker 上的任务标记（保持行数与边界不变）。
 */
function stripTaskMarkersInListSpan(
  lines: string[],
  startIndex: number,
  endIndex: number,
): { lines: string[]; tasks: TaskInfo[] } {
  const out = lines.slice();
  const tasks: TaskInfo[] = [];
  const initial = parseListMarkerLine(out[startIndex] ?? "");
  if (!initial) return { lines: out, tasks };

  for (let i = startIndex; i < endIndex; i++) {
    const marker = parseListMarkerLine(out[i] ?? "", { allowIndented: true });
    if (!marker || !listsMatch(marker, initial)) continue;

    const stripped = stripTaskMarkerFromMarkerLine(out[i] ?? "");
    out[i] = stripped.line;
    if (stripped.task) tasks.push(stripped.task);
  }

  return { lines: out, tasks };
}

/** 按 DFS 顺序把任务状态写入 list_item.props，并标记含任务的子列表 */
function applyTasksToItems(listNode: MarkdownNode, tasks: TaskInfo[]): void {
  let idx = 0;

  function walk(node: MarkdownNode): void {
    for (const item of node.children ?? []) {
      if (item.type !== "list_item") continue;
      if (idx < tasks.length) {
        item.props = { ...item.props, task: tasks[idx++] };
      }
      for (const child of item.children ?? []) {
        if (child.type === "list") walk(child);
      }
    }
  }

  function markNestedTaskLists(node: MarkdownNode): void {
    for (const item of node.children ?? []) {
      if (item.type !== "list_item") continue;
      for (const child of item.children ?? []) {
        if (child.type !== "list") continue;
        const hasTaskItems = (child.children ?? []).some(
          (li) => li.type === "list_item" && li.props?.task != null,
        );
        if (hasTaskItems) {
          child.props = { ...child.props, isTaskList: true };
        }
        markNestedTaskLists(child);
      }
    }
  }

  walk(listNode);
  markNestedTaskLists(listNode);
  listNode.props = { ...listNode.props, isTaskList: true };
}

function renderTaskMarker(task: TaskInfo): string {
  const label = TASK_ARIA_LABELS[task.state] ?? task.state;
  return `<span class="marker" role="img" aria-label="${label}"></span>`;
}

function taskListItemAttrs(task: TaskInfo): string {
  const cls = taskStateClass(task.state);
  return ` class="task-item ${cls}" data-state="${task.state}"`;
}

function getTask(item: MarkdownNode): TaskInfo | undefined {
  return item.props?.task as TaskInfo | undefined;
}

function renderTaskItem(
  item: MarkdownNode,
  ctx: RenderContext,
  isLoose: boolean,
): string {
  const task = getTask(item);
  const checkbox = task ? `${renderTaskMarker(task)} ` : "";
  const liAttrs = task ? taskListItemAttrs(task) : "";

  if (!item.children?.length) {
    return `<li${liAttrs}>${checkbox}</li>`;
  }

  if (isLoose) {
    const parts = item.children.map((child, childIndex) => {
      if (childIndex === 0 && task && child.type === "paragraph") {
        return `<p>${checkbox}${ctx.renderInline(child.children ?? [])}</p>`;
      }
      return ctx.renderBlock([child]).replace(/\n$/, "");
    });
    return `<li${liAttrs}>\n${parts.join("\n")}\n</li>`;
  }

  if (item.children.length === 1) {
    const child = item.children[0];
    if (child.type === "paragraph") {
      return `<li${liAttrs}>${checkbox}${ctx.renderInline(child.children ?? [])}</li>`;
    }
    return `<li${liAttrs}>\n${checkbox}${ctx.renderBlock(item.children)}\n</li>`;
  }

  const parts = item.children.map((child, index) => {
    const prefix = index === 0 ? checkbox : "";
    if (child.type === "paragraph") {
      return `${prefix}${ctx.renderInline(child.children ?? [])}`;
    }
    return ctx.renderBlock([child]).replace(/\n$/, "");
  });

  const lead = item.children[0].type !== "paragraph" ? "\n" : "";
  const tail =
    item.children[item.children.length - 1].type === "paragraph" ? "" : "\n";
  return `<li${liAttrs}>${lead}${parts.join("\n")}${tail}</li>`;
}

class TaskListBlockParser extends BaseBlockParser {
  constructor() {
    super("list");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, ctx: BlockParseContext): boolean {
    return listParser.canOpenAt(lines, index, ctx);
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    if (!isTaskListStart(lines[index] ?? "")) {
      return listParser.parse(lines, index, ctx);
    }

    const probe = listParser.parse(lines, index, ctx);
    if (!probe?.node) return probe;

    const endIndex = probe.nextIndex;
    const { lines: stripped, tasks } = stripTaskMarkersInListSpan(
      lines,
      index,
      endIndex,
    );
    const result = listParser.parse(stripped, index, ctx);
    if (!result?.node) return result;

    applyTasksToItems(result.node, tasks);
    return { node: result.node, nextIndex: endIndex };
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    if (!node.props?.isTaskList) {
      return listParser.render(node, ctx);
    }

    const props = node.props ?? {};
    const tag = props.ordered ? "ol" : "ul";
    const startAttr =
      props.ordered && props.start !== 1 ? ` start="${props.start}"` : "";
    const listLooseFromBetween = Boolean(props.looseFromBetween);
    const anyItemLoose = (node.children ?? []).some(
      (item) => item.props?.loose,
    );
    const isLoose = listLooseFromBetween || anyItemLoose;
    const itemsHtml = (node.children ?? [])
      .map((item) => renderTaskItem(item, ctx, isLoose))
      .join("\n");

    return `<${tag} class="task-list"${startAttr}${this.sourceLineAttrs(node)}>\n${itemsHtml}\n</${tag}>`;
  }
}

export default new TaskListBlockParser();
