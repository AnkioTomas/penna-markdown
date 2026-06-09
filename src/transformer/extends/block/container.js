/**
 * @file 块级语法拓展：Cherry 容器面板
 * @module transformer/extends/block/container
 *
 * 语法示例：
 * ```
 * ::: note 标题
 * 内容
 * :::
 * ```
 *
 * 支持类型别名（如 `im` → `important`）及文本对齐类型（left/center/right/justify）。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";

/** 容器开标记行：`::: type 标题` */
const OPEN_RE = /^ {0,3}:::(?!:)(.+)$/;

/** 容器闭标记行：`:::` */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 容器类型缩写 → 完整类型名 */
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

/** 文本对齐类容器类型集合 */
const ALIGN_TYPES = new Set(["left", "center", "right", "justify"]);


/**
 * 解析开标记行中的类型与标题。
 *
 * @param {string} raw - 开标记 `:::` 后的原始文本
 * @returns {{ containerType: string, title: string } | null}
 */
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

/**
 * Cherry 容器面板块解析器。
 *
 * @extends {BaseBlockParser}
 */
class ContainerBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "container", priority: 86 });
  }

  /** @inheritdoc */
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
        const innerChildren = ctx.parseBlocks(normalizeInnerLines(innerLines));
        const node = createNode(this.type, {
          containerType: info.containerType,
          title: info.title,
          titleNodes: info.title ? ctx.parseInline(info.title) : [],
          children: innerChildren,
        });
        return { node, nextIndex: i + 1 };
      }
      innerLines.push(lines[i]);
      i += 1;
    }

    return null;
  }

  /** @inheritdoc */
  render(node, ctx) {
    const { containerType, title, titleNodes, children } = node;
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
