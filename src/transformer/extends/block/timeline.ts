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
import { blockLength, pickAttr } from "./card/shared.js";

const OPEN_RE = /^ {0,3}:::(?!:)\s+timeline(?:\s+(.*))?$/;
const CLOSE_RE = /^ {0,3}:::\s*$/;
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;
const ITEM_HEAD_RE = /^ {0,3}-\s+(.+)$/;
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

function isConfigLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.length > 0 && /^\w+=/.test(trimmed);
}

function parseConfigLine(line: string): Record<string, string> {
  const config: Record<string, string> = {};
  const re = /(\w+)=(?:"([^"]*)"|(\S+))/g;
  let match = re.exec(line.trim());

  while (match) {
    config[match[1]] = match[2] ?? match[3];
    match = re.exec(line.trim());
  }

  return config;
}

function resolveItemConfig(
  raw: Record<string, string>,
  container: { line: string },
) {
  const type = TIMELINE_TYPES.has(raw.type) ? raw.type : "info";
  const line = LINE_STYLES.has(raw.line) ? raw.line : container.line;
  const placement =
    raw.placement === "right" || raw.placement === "left"
      ? raw.placement
      : "left";

  return {
    time: raw.time ?? "",
    type,
    line,
    placement,
    color: raw.color ?? "",
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
    title: string;
    config: Record<string, string>;
    contentLines: string[];
  }> = [];
  let i = 0;

  while (i < lines.length) {
    const head = lines[i]?.match(ITEM_HEAD_RE);
    if (!head || TASK_ITEM_RE.test(lines[i] ?? "")) {
      i += 1;
      continue;
    }

    const titleLines = [head[1].trim()];
    i += 1;

    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (isTimelineItemHead(line)) break;
      if (isConfigLine(line)) break;
      if (line.trim() === "") break;
      titleLines.push(line.trim());
      i += 1;
    }

    let config: Record<string, string> = {};
    if (i < lines.length && isConfigLine(lines[i] ?? "")) {
      config = parseConfigLine(lines[i] ?? "");
      i += 1;
    }

    while (i < lines.length && (lines[i] ?? "").trim() === "") {
      i += 1;
    }

    const contentLines: string[] = [];
    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (isTimelineItemHead(line)) break;
      contentLines.push(line);
      i += 1;
    }

    sections.push({
      title: titleLines.join("\n"),
      config,
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
      const config = resolveItemConfig(section.config, container);
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
          time: config.time,
          itemType: config.type,
          line: config.line,
          placement: config.placement,
          color: config.color,
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
      const color = String(item.props?.color ?? "");
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

      const style = color
        ? ` style="--cherry-timeline-c-line: ${escapeHtml(color)}; --cherry-timeline-c-point: ${escapeHtml(color)}"`
        : "";

      const timeHtml = time
        ? `<p class="cherry-timeline-time">${escapeHtml(time)}</p>`
        : "";

      return [
        `<div class="${classes}"${style}>`,
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
