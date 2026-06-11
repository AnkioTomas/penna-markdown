/**
 * @file 块级语法拓展：时间线
 * @module transformer/extends/block/timeline
 *
 * ```
 * ::: timeline placement="between" line="dotted"
 * - 节点一
 *   time=2025-03-20 type=success
 *
 *   正文内容
 * :::
 * ```
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import { pickAttr } from "./card/shared.js";

/** 时间线开标记行：`::: timeline` + 容器配置 */
const OPEN_RE = /^ {0,3}:::(?!:)\s+timeline(?:\s+(.*))?$/;

/** 时间线闭标记行：`:::` */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 嵌套三冒号容器开标记（排除四冒号块） */
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;

/** 时间节点标题行：`- 标题` */
const ITEM_HEAD_RE = /^ {0,3}-\s+(.+)$/;

/** @type {Set<string>} */
const TIMELINE_TYPES = new Set([
  "info",
  "tip",
  "success",
  "warning",
  "danger",
  "caution",
  "important",
]);

/** @type {Set<string>} */
const LINE_STYLES = new Set(["solid", "dashed", "dotted"]);

/** @type {Set<string>} */
const PLACEMENTS = new Set(["left", "right", "between"]);

/**
 * @param {string} raw
 * @param {string} name
 * @returns {string}
 */
function pickTimelineAttr(raw, name) {
  const quoted = pickAttr(raw, name);
  if (quoted) return quoted;
  const bare = String(raw ?? "").match(new RegExp(`\\b${name}=([^\\s"]+)`));
  return bare?.[1] ?? "";
}

/**
 * @param {string} raw
 * @returns {{ placement: string, line: string }}
 */
function parseTimelineContainer(raw) {
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

/**
 * @param {string} line
 * @returns {boolean}
 */
function isConfigLine(line) {
  const trimmed = line.trim();
  return trimmed.length > 0 && /^\w+=/.test(trimmed);
}

/**
 * @param {string} line
 * @returns {Record<string, string>}
 */
function parseConfigLine(line) {
  /** @type {Record<string, string>} */
  const config = {};
  const re = /(\w+)=(?:"([^"]*)"|(\S+))/g;
  let match = re.exec(line.trim());

  while (match) {
    config[match[1]] = match[2] ?? match[3];
    match = re.exec(line.trim());
  }

  return config;
}

/**
 * @param {Record<string, string>} raw
 * @param {{ line: string }} container
 * @returns {{
 *   time: string,
 *   type: string,
 *   line: string,
 *   placement: string,
 *   color: string,
 * }}
 */
function resolveItemConfig(raw, container) {
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

/**
 * @param {string[]} lines
 * @param {number} start
 * @returns {{ innerLines: string[], nextIndex: number } | null}
 */
function readTimelineInnerLines(lines, start) {
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
 * @param {string[]} lines
 * @returns {Array<{ title: string, config: Record<string, string>, contentLines: string[] }>}
 */
function parseTimelineSections(lines) {
  /** @type {Array<{ title: string, config: Record<string, string>, contentLines: string[] }>} */
  const sections = [];
  let i = 0;

  while (i < lines.length) {
    const head = lines[i]?.match(ITEM_HEAD_RE);
    if (!head) {
      i += 1;
      continue;
    }

    const titleLines = [head[1].trim()];
    i += 1;

    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (ITEM_HEAD_RE.test(line)) break;
      if (isConfigLine(line)) break;
      if (line.trim() === "") break;
      titleLines.push(line.trim());
      i += 1;
    }

    /** @type {Record<string, string>} */
    let config = {};
    if (i < lines.length && isConfigLine(lines[i] ?? "")) {
      config = parseConfigLine(lines[i] ?? "");
      i += 1;
    }

    while (i < lines.length && (lines[i] ?? "").trim() === "") {
      i += 1;
    }

    const contentLines = [];
    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (ITEM_HEAD_RE.test(line)) break;
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

/**
 * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[][]} titleLineNodes
 * @param {import('@/transformer/core/ParserContext.js').RenderContext} ctx
 * @returns {string}
 */
function renderTimelineTitle(titleLineNodes, ctx) {
  const lines = titleLineNodes ?? [];
  if (lines.length === 0) return "";

  const html = lines.map((nodes) => ctx.renderInline(nodes)).join("<br>");
  return `<p class="cherry-timeline-title">${html}</p>`;
}

/**
 * 时间线块解析器。
 *
 * @extends {BaseBlockParser}
 */
class TimelineBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "timeline", priority: 88 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    const open = line.match(OPEN_RE);
    if (!open) return null;

    const block = readTimelineInnerLines(lines, index + 1);
    if (!block) return null;

    const container = parseTimelineContainer(open[1] ?? "");
    const sections = parseTimelineSections(normalizeInnerLines(block.innerLines));
    if (sections.length === 0) return null;

    const items = sections.map((section) => {
      const config = resolveItemConfig(section.config, container);
      const titleLines = section.title
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return createNode("timeline_item", {
        title: section.title,
        titleLineNodes: titleLines.map((line) => ctx.parseInline(line)),
        time: config.time,
        itemType: config.type,
        line: config.line,
        placement: config.placement,
        color: config.color,
        children: ctx.parseBlocks(normalizeInnerLines(section.contentLines)),
      });
    });

    return {
      node: createNode(this.type, {
        placement: container.placement,
        line: container.line,
        children: items,
      }),
      nextIndex: block.nextIndex,
    };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const items = node.children ?? [];
    if (items.length === 0) return "";

    const containerPlacement = String(node.placement ?? "left");
    const containerClasses = [
      "cherry-timeline",
      `placement-${containerPlacement}`,
    ].join(" ");

    const rendered = items.map((item) => {
      const type = String(item.itemType ?? "info");
      const line = String(item.line ?? "solid");
      const itemPlacement = String(item.placement ?? "left");
      const color = String(item.color ?? "");
      const time = String(item.time ?? "");

      const classes = [
        "cherry-timeline-item",
        type,
        `line-${line}`,
        containerPlacement === "between"
          ? `placement-${itemPlacement}`
          : "placement-left",
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
        renderTimelineTitle(item.titleLineNodes, ctx),
        ctx.renderBlock(item.children ?? []),
        `</div>`,
        timeHtml,
        `</div>`,
        `</div>`,
      ].join("");
    });

    return [
      `<div class="${containerClasses}">`,
      `<div class="cherry-timeline-box">${rendered.join("")}</div>`,
      `</div>`,
    ].join("");
  }
}

export default new TimelineBlockParser();
