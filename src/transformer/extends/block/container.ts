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
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";

/** 容器开标记行：`::: type 标题` */
const OPEN_RE = /^ {0,3}:::(?!:)(.+)$/;

/** 容器闭标记行：`:::` */
const CLOSE_RE = /^ {0,3}:::\s*$/;

/** 嵌套三冒号容器开标记（排除四冒号块） */
const NESTED_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;

/** 容器类型缩写 → 完整类型名 */
const TYPE_ALIASES: Record<string, string> = {
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

/** 使用 alert 主题色的语义容器类型 */
const THEME_TYPES = new Set([
  "note",
  "tip",
  "important",
  "warning",
  "caution",
  "danger",
  "info",
]);

function parseOpenInfo(raw: string): { containerType: string; title: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\S+)(?:\s+(.*))?$/);
  if (!match) return null;

  const typeToken = match[1].toLowerCase();
  const containerType = TYPE_ALIASES[typeToken] ?? typeToken;
  const title = match[2]?.trim() ?? "";

  return { containerType, title };
}

function readContainerInnerLines(
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

class ContainerBlockParser extends BaseBlockParser {
  constructor() {
    super("container");
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const line = lines[index] ?? "";
    const open = line.match(OPEN_RE);
    if (!open) return null;

    const info = parseOpenInfo(open[1]);
    if (!info) return null;

    const block = readContainerInnerLines(lines, index + 1);
    if (!block) return null;

    const innerChildren = ctx.parseBlocks(normalizeInnerLines(block.innerLines));
    const titleNodes = info.title ? ctx.parseInline(info.title) : [];

    const node = createNode(
      this.type,
      block.nextIndex - index,
      undefined,
      innerChildren,
      {
        containerType: info.containerType,
        title: info.title,
        titleNodes,
      },
    );

    return { node, nextIndex: block.nextIndex };
  }

  render(node: MarkdownNode, ctx: RenderContext) {
    const containerType = String(node.props?.containerType ?? "note");
    const title = String(node.props?.title ?? "");
    const titleNodes = (node.props?.titleNodes as MarkdownNode[] | undefined) ?? [];
    const body = ctx.renderBlock(node.children ?? []);

    if (ALIGN_TYPES.has(containerType)) {
      const parts = [
        `<div class="cherry-align cherry-align--${escapeHtml(containerType)}">`,
      ];
      if (title) {
        parts.push(
          `<p class="cherry-align__title">${ctx.renderInline(titleNodes)}</p>`,
        );
      }
      if (body) parts.push(body);
      parts.push("</div>");
      return parts.join("\n");
    }

    const themeType = THEME_TYPES.has(containerType) ? containerType : "note";
    const parts = [`<div class="cherry-alert cherry-alert--${escapeHtml(themeType)}">`];
    if (title) {
      parts.push(
        `<p class="cherry-alert__title">${ctx.renderInline(titleNodes)}</p>`,
      );
    }
    if (body) parts.push(body);
    parts.push("</div>");
    return parts.join("\n");
  }
}

export default new ContainerBlockParser();
