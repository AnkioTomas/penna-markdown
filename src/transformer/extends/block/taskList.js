/**
 * 扩展任务列表：priority > list，首行含任务标记时接管，否则交还 GFM list
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import listParser from "@/transformer/gfm/block/list.js";
import {
  expandLinePrefixTabs,
  listsMatch,
  parseListMarkerLine,
} from "@/transformer/utils/tabs.js";
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

const TASK_MARKER_RE = /^(\s*)\[([ xX/><!\-])\]([ \t]+)/;

/** @param {string} text */
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

/** @param {{ state: string, checked: boolean }} task */
function renderTaskCheckbox(task) {
  const checked = task.checked ? ' checked=""' : "";
  const extended = task.state !== "todo" && task.state !== "done";
  const stateAttr = extended ? ` data-task-state="${task.state}"` : "";
  const cls = extended
    ? ` class="task-checkbox task-checkbox-${task.state}"`
    : "";
  return `<input${checked} disabled="" type="checkbox"${stateAttr}${cls}>`;
}

/** @param {{ state: string }} task */
function taskListItemAttrs(task) {
  return ` class="task-list-item task-list-item-${task.state}" data-task-state="${task.state}"`;
}

function isTaskListStart(line) {
  const marker = parseListMarkerLine(line);
  if (!marker || marker.ordered) return false;
  return !!parseTaskListMarker(expandLinePrefixTabs(marker.content));
}

function rebuildMarkerLine(line, marker, content) {
  return line.slice(0, marker.contentOffset) + content;
}

/** @param {string[]} lines @param {number} start @param {number} end */
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

function attachTasks(node, tasks) {
  node.props = { ...node.props, isTaskList: true };
  for (let i = 0; i < node.children.length; i += 1) {
    const task = tasks[i];
    if (task) {
      node.children[i].props = { ...node.children[i].props, task };
    }
  }
}

function renderTaskItem(item, ctx, isLoose) {
  const task = item.props?.task;
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

class TaskListBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "list", priority: 55 });
  }

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

  render(node, ctx) {
    if (!node.props?.isTaskList) {
      return listParser.render(node, ctx);
    }

    const tag = node.props.ordered ? "ol" : "ul";
    const startAttr =
      node.props.ordered && node.props.start !== 1
        ? ` start="${node.props.start}"`
        : "";
    const isLoose = node.props.loose;
    const itemsHtml = node.children
      .map((item) => renderTaskItem(item, ctx, isLoose))
      .join("\n");

    return `<${tag}${startAttr}>\n${itemsHtml}\n</${tag}>`;
  }
}

export default new TaskListBlockParser();
