/**
 * @file 卡片语法公共工具
 * @module transformer/extends/block/card/shared
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";

/** 三冒号块闭标记 */
export const TRIPLE_CLOSE_RE = /^ {0,3}:::\s*$/;

/** 四冒号块闭标记 */
export const QUAD_CLOSE_RE = /^ {0,3}::::\s*$/;

/** 嵌套三冒号开标记（排除四冒号块） */
const TRIPLE_OPEN_RE = /^ {0,3}:::(?!:)\s+\S/;

/** 嵌套四冒号开标记 */
const QUAD_OPEN_RE = /^ {0,3}::::(?!:)\s+\S/;

export function pickAttr(raw: string, name: string): string {
  const match = String(raw ?? "").match(new RegExp(`\\b${name}="([^"]*)"`));
  return match?.[1] ?? "";
}

export function parseTitleInline(attrs: string, ctx: BlockParseContext) {
  const title = pickAttr(attrs, "title");
  return {
    title,
    titleNodes: title ? ctx.parseInline(title) : [],
  };
}

export function stripLinkAttrs(attrs: string): string {
  return String(attrs ?? "")
    .replace(/\b(?:link|href|icon|image)="[^"]*"/g, "")
    .trim();
}

export function parseLinkCardOpen(attrs: string, ctx: BlockParseContext) {
  const link = pickAttr(attrs, "link") || pickAttr(attrs, "href");
  const icon = pickAttr(attrs, "icon") || pickAttr(attrs, "image");
  const title = stripLinkAttrs(attrs);
  return {
    title,
    titleNodes: title ? ctx.parseInline(title) : [],
    link,
    icon,
  };
}

export function parseRepoCardOpen(attrs: string) {
  const trimmed = String(attrs ?? "").trim();
  if (!trimmed) {
    return { repo: "", link: "", visibility: "Public" };
  }

  const match = trimmed.match(/^(\S+)(?:\s+(.*))?$/);
  const repo = (match?.[1] ?? "").replace(/\.git$/, "");
  const rest = match?.[2] ?? "";

  return {
    repo,
    link: pickAttr(rest, "link") || pickAttr(rest, "href"),
    visibility: pickAttr(rest, "visibility") || "Public",
  };
}

export function blockLength(lines: string[], start: number, end: number): number {
  let length = 0;
  for (let i = start; i < end; i++) {
    length += lines[i]?.length ?? 0;
  }
  return length;
}

export interface ColonBlockResult {
  attrs: string;
  innerLines: string[];
  nextIndex: number;
}

export function readTripleColonBlock(
  lines: string[],
  start: number,
  openRe: RegExp,
): ColonBlockResult | null {
  const line = lines[start] ?? "";
  const match = line.match(openRe);
  if (!match) return null;

  const innerLines: string[] = [];
  let depth = 0;
  let i = start + 1;

  while (i < lines.length) {
    const ln = lines[i] ?? "";

    if (TRIPLE_CLOSE_RE.test(ln)) {
      if (depth === 0) {
        return { attrs: match[1] ?? "", innerLines, nextIndex: i + 1 };
      }
      depth -= 1;
      innerLines.push(ln);
      i += 1;
      continue;
    }

    if (TRIPLE_OPEN_RE.test(ln)) {
      depth += 1;
    }

    innerLines.push(ln);
    i += 1;
  }

  return null;
}

export function readQuadColonBlock(
  lines: string[],
  start: number,
  openRe: RegExp,
): ColonBlockResult | null {
  const line = lines[start] ?? "";
  const match = line.match(openRe);
  if (!match) return null;

  const innerLines: string[] = [];
  let depth = 0;
  let i = start + 1;

  while (i < lines.length) {
    const ln = lines[i] ?? "";

    if (QUAD_CLOSE_RE.test(ln)) {
      if (depth === 0) {
        return { attrs: match[1] ?? "", innerLines, nextIndex: i + 1 };
      }
      depth -= 1;
      innerLines.push(ln);
      i += 1;
      continue;
    }

    if (TRIPLE_CLOSE_RE.test(ln)) {
      if (depth > 0) {
        depth -= 1;
        innerLines.push(ln);
        i += 1;
        continue;
      }
    }

    if (QUAD_OPEN_RE.test(ln)) {
      depth += 1;
    } else if (TRIPLE_OPEN_RE.test(ln)) {
      depth += 1;
    }

    innerLines.push(ln);
    i += 1;
  }

  return null;
}

export type { MarkdownNode };
