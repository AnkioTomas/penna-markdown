/**
 * @file 块级语法拓展：时间线
 * @module transformer/extends/block/timeline
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import {
  createNode,
  type MarkdownNode,
} from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import {
  blockLength,
  pickAttr,
} from "@/transformer/extends/block/card/shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+timeline(?:\s+(.*))?$/;
const CLOSE_RE = /^ {0,3}:::\s*$/;
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;
// 新版前置中括号解析正则：- [2024-01-01:success] 里程碑标题
const ITEM_HEAD_RE = /^ {0,3}-\s+\[([^\]]+)\]\s+(.*)$/;
/** 与 taskList 一致：`- [ ]` / `- [x]` 等是任务项，不是 timeline 节点 */
const TASK_ITEM_RE = /^ {0,3}-\s+\[(?: |x|X|\/|>|<|-|\!)\]\s/;

function isTimelineItemHead(line: string): boolean {
  return ITEM_HEAD_RE.test(line) && !TASK_ITEM_RE.test(line);
}

const TIMELINE_TYPES = new Set([
  "info",
  "tip",
  "success",
  "warning",
  "danger",
  "caution",
  "important",
]);

const LINE_STYLES = new Set(["solid", "dashed", "dotted"]);
const PLACEMENTS = new Set(["left", "right", "between"]);

function pickTimelineAttr(raw: string, name: string): string {
  const quoted = pickAttr(raw, name);
  if (quoted) return quoted;
  const bare = String(raw ?? "").match(new RegExp(`\\b${name}=([^\\s"]+)`));
  return bare?.[1] ?? "";
}

function parseTimelineContainer(raw: string) {
  const attrs = String(raw ?? "").trim();

  return {
    placement: PLACEMENTS.has(pickTimelineAttr(attrs, "placement"))
      ? pickTimelineAttr(attrs, "placement")
      : "left",
    line: LINE_STYLES.has(pickTimelineAttr(attrs, "line"))
      ? pickTimelineAttr(attrs, "line")
      : "solid",
  };
}

function readTimelineInnerLines(
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

function parseTimelineSections(lines: string[]) {
  const sections: Array<{
    time: string;
    type: string;
    title: string;
    contentLines: string[];
  }> = [];
  let i = 0;

  while (i < lines.length) {
    const head = lines[i]?.match(ITEM_HEAD_RE);
    if (!head || TASK_ITEM_RE.test(lines[i] ?? "")) {
      i += 1;
      continue;
    }

    const timeRaw = head[1].trim();
    const titleLines = [head[2].trim()];

    let time = timeRaw;
    let type = "info";
    const colonIdx = timeRaw.lastIndexOf(":");
    if (colonIdx > 0) {
      const possibleType = timeRaw.slice(colonIdx + 1);
      if (TIMELINE_TYPES.has(possibleType)) {
        type = possibleType;
        time = timeRaw.slice(0, colonIdx);
      }
    }

    i += 1;

    const contentLines: string[] = [];
    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (isTimelineItemHead(line)) break;
      contentLines.push(line);
      i += 1;
    }

    sections.push({
      time,
      type,
      title: titleLines.join("\n"),
      contentLines,
    });
  }

  return sections;
}

function renderTimelineTitle(
  titleLineNodes: MarkdownNode[][],
  ctx: RenderContext,
): string {
  const lines = titleLineNodes ?? [];
  if (lines.length === 0) return "";

  const html = lines.map((nodes) => ctx.renderInline(nodes)).join("<br>");
  return `<p class="cherry-timeline-title">${html}</p>`;
}

class TimelineBlockParser extends BaseBlockParser {
  constructor() {
    super("timeline");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    const open = line.match(OPEN_RE);
    if (!open) return null;

    const block = readTimelineInnerLines(lines, index + 1);
    if (!block) return null;

    const container = parseTimelineContainer(open[1] ?? "");
    const sections = parseTimelineSections(
      normalizeInnerLines(block.innerLines),
    );
    if (sections.length === 0) return null;

    const items = sections.map((section) => {
      const titleLines = section.title
        .split("\n")
        .map((ln) => ln.trim())
        .filter(Boolean);

      return createNode(
        "timeline_item",
        0,
        undefined,
        ctx.parseBlocks(normalizeInnerLines(section.contentLines)),
        {
          title: section.title,
          titleLineNodes: titleLines.map((ln) => ctx.parseInline(ln)),
          time: section.time,
          itemType: section.type,
          line: container.line,
          placement: container.placement,
        },
      );
    });

    return {
      node: createNode(
        this.type,
        blockLength(lines, index, block.nextIndex),
        undefined,
        items,
        {
          placement: container.placement,
          line: container.line,
        },
      ),
      nextIndex: block.nextIndex,
    };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const items = node.children ?? [];
    if (items.length === 0) return "";

    const containerPlacement = String(node.props?.placement ?? "left");
    const containerClasses = [
      "cherry-timeline",
      `cherry-timeline--placement-${containerPlacement}`,
    ].join(" ");

    const rendered = items.map((item) => {
      const type = String(item.props?.itemType ?? "info");
      const line = String(item.props?.line ?? "solid");
      const itemPlacement = String(item.props?.placement ?? "left");
      const time = String(item.props?.time ?? "");
      const titleLineNodes =
        (item.props?.titleLineNodes as MarkdownNode[][] | undefined) ?? [];

      const classes = [
        "cherry-timeline-item",
        `cherry-timeline-item--${type}`,
        `cherry-timeline-item--line-${line}`,
        containerPlacement === "between"
          ? `cherry-timeline-item--placement-${itemPlacement}`
          : "cherry-timeline-item--placement-left",
      ].join(" ");

      const timeHtml = time
        ? `<p class="cherry-timeline-time">${escapeHtml(time)}</p>`
        : "";

      return [
        `<div class="${classes}">`,
        `<div class="cherry-timeline-line"><span class="cherry-timeline-point"></span></div>`,
        `<div class="cherry-timeline-container">`,
        `<div class="cherry-timeline-content">`,
        renderTimelineTitle(titleLineNodes, ctx),
        ctx.renderBlock(item.children ?? []),
        `</div>`,
        timeHtml,
        `</div>`,
        `</div>`,
      ].join("");
    });

    return [
      `<div class="${containerClasses}"${this.sourceLineAttrs(node)}>`,
      `<div class="cherry-timeline-box">${rendered.join("")}</div>`,
      `</div>`,
    ].join("");
  }
}

export default new TimelineBlockParser();
