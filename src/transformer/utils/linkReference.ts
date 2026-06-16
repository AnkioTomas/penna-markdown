/**
 * @file 引用链接 render 阶段解析
 * @module transformer/utils/linkReference
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext";
import { escapeHtml, htmlAttr } from "@/transformer/utils/escape.js";
import { unescapeHref } from "@/transformer/utils/linkDestination.js";
import { findLinkLabelEnd, findLinkTextEnd } from "@/transformer/utils/linkLabel.js";
import { normalizeLinkRefLabel } from "@/transformer/utils/normalize.js";

export interface ReferenceLinkCandidate {
  offset: number;
  end: number;
  refKey: string;
  children: MarkdownNode[];
}

/** 从 `[` 起向后收集连续的 `[..][..]` / `[..]` 括号段，供 render 阶段选用。 */
export function findReferenceWindowEnd(src: string, start: number): number {
  let end = start;
  while (end < src.length) {
    if (src[end] !== "[") break;
    const labelEnd = findLinkTextEnd(src, end + 1);
    if (labelEnd === -1) break;
    const next = labelEnd + 1;
    if (next < src.length && src[next] === "[") {
      const refEnd = findLinkLabelEnd(src, next + 1);
      if (refEnd === -1) break;
      end = refEnd + 1;
      continue;
    }
    end = next;
    break;
  }
  return end;
}

/** 收集 span 内所有 full reference `[text][ref]` 候选（parse 阶段，不查 store）。 */
export function collectFullReferenceCandidates(
  span: string,
  parseInline: (text: string) => MarkdownNode[],
): ReferenceLinkCandidate[] {
  const out: ReferenceLinkCandidate[] = [];
  for (let i = 0; i < span.length; i += 1) {
    if (span[i] !== "[") continue;
    const labelEnd = findLinkTextEnd(span, i + 1);
    if (labelEnd === -1) continue;
    const nextIndex = labelEnd + 1;
    if (nextIndex >= span.length || span[nextIndex] !== "[") continue;
    const refLabelEnd = findLinkLabelEnd(span, nextIndex + 1);
    if (refLabelEnd === -1) continue;
    const labelText = span.slice(i + 1, labelEnd);
    const refLabel = span.slice(nextIndex + 1, refLabelEnd);
    const refId = refLabel.length > 0 ? refLabel : labelText;
    out.push({
      offset: i,
      end: refLabelEnd + 1,
      refKey: normalizeLinkRefLabel(refId),
      children: parseInline(labelText),
    });
  }
  return out;
}

/** render 阶段：按从左到右尝试候选，选用 store 中首个命中的引用。 */
export function renderReferenceLinkSpan(
  window: string,
  candidates: ReferenceLinkCandidate[],
  ctx: RenderContext,
  literalFallback: string,
): string {
  for (const c of candidates) {
    const def = ctx.store.get<{ href: string; title: string }>("ref_" + c.refKey);
    if (!def) continue;
    const inner = ctx.renderInline(c.children);
    const title = def.title || "";
    const link = `<a href="${escapeHtml(def.href)}"${htmlAttr("title", title)}>${inner}</a>`;
    let out = window.slice(0, c.offset) + link;
    const tail = window.slice(c.end);
    out += renderShortcutReferenceTail(tail, ctx);
    return out;
  }
  return unescapeHref(literalFallback);
}

/** 图片 alt 取纯文本（emphasis 等展平为字面量）。 */
export function flattenImageAlt(nodes: MarkdownNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return n.value || "";
      if (n.children) return flattenImageAlt(n.children);
      return "";
    })
    .join("");
}

/** render 阶段：shortcut / full / collapsed 引用图片。 */
export function renderReferenceImage(
  refKey: string,
  children: MarkdownNode[],
  ctx: RenderContext,
): string {
  const def = ctx.store.get<{ href: string; title: string }>("ref_" + refKey);
  const inner = ctx.renderInline(children);
  if (!def) return `![${inner}]`;
  const alt = flattenImageAlt(children);
  const title = def.title || "";
  return `<img src="${escapeHtml(def.href)}" alt="${escapeHtml(alt)}"${htmlAttr("title", title)} />`;
}

/** window 尾部残留的 `[label]` shortcut（render 阶段解析）。 */
function renderShortcutReferenceTail(tail: string, ctx: RenderContext): string {
  if (!tail.startsWith("[")) return unescapeHref(tail);
  const labelEnd = findLinkTextEnd(tail, 1);
  if (labelEnd === -1) return unescapeHref(tail);
  const next = labelEnd + 1;
  if (next < tail.length && (tail[next] === "(" || tail[next] === "[")) {
    return unescapeHref(tail);
  }
  const labelText = tail.slice(1, labelEnd);
  const def = ctx.store.get<{ href: string; title: string }>(
    "ref_" + normalizeLinkRefLabel(labelText),
  );
  if (!def) return unescapeHref(tail);
  const title = def.title || "";
  return `<a href="${escapeHtml(def.href)}"${htmlAttr("title", title)}>${escapeHtml(labelText)}</a>`;
}
