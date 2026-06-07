/**
 * 容器语法：::: type 标题 ... :::
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";

const OPEN_RE = /^ {0,3}:::(?!:)(.+)$/;
const CLOSE_RE = /^ {0,3}:::\s*$/;

const TYPE_ALIASES = {
  im: "important",
  i: "info",
  w: "warning",
  d: "danger",
  n: "note",
  r: "right",
  c: "center",
  l: "left",
  j: "justify",
  t: "tip",
};

const ALIGN_TYPES = new Set(["left", "center", "right", "justify"]);

function normalizeInnerLines(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return lines.slice(start, end);
}

/** @param {string} raw */
function parseOpenInfo(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\S+)(?:\s+(.*))?$/);
  if (!match) return null;

  const typeToken = match[1].toLowerCase();
  const containerType = TYPE_ALIASES[typeToken] ?? typeToken;
  const title = match[2]?.trim() ?? "";

  return { containerType, title };
}

class ContainerBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "container", priority: 86 });
  }

  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    const open = line.match(OPEN_RE);
    if (!open) return null;

    const info = parseOpenInfo(open[1]);
    if (!info) return null;

    const innerLines = [];
    let i = index + 1;

    while (i < lines.length) {
      if (CLOSE_RE.test(lines[i] ?? "")) {
        const innerAst = ctx.parse(normalizeInnerLines(innerLines));
        const node = createNode(this.type, {
          containerType: info.containerType,
          title: info.title,
          titleNodes: info.title ? ctx.parseInline(info.title) : [],
          children: innerAst.children,
        });
        return { node, nextIndex: i + 1 };
      }
      innerLines.push(lines[i]);
      i += 1;
    }

    return null;
  }

  render(node, ctx) {
    const { containerType, title, titleNodes, children } = node.props;
    const isAlign = ALIGN_TYPES.has(containerType);
    const className = isAlign
      ? `cherry-text-align cherry-text-align__${escapeHtml(containerType)}`
      : `cherry-panel cherry-panel__${escapeHtml(containerType)}`;
    const style = isAlign ? ` style="text-align:${containerType};"` : "";

    const titleClass = title
      ? "cherry-panel--title cherry-panel--title__not-empty"
      : "cherry-panel--title";
    const titleHtml = title
      ? `<div class="${titleClass}">${ctx.renderInline(titleNodes)}</div>`
      : "";

    const body = ctx.renderBlock(children);
    const parts = [`<div class="${className}"${style}>`];
    if (titleHtml) parts.push(titleHtml);
    parts.push(`<div class="cherry-panel--body">${body}</div>`);
    parts.push("</div>");
    return parts.join("\n");
  }
}

export default new ContainerBlockParser();
