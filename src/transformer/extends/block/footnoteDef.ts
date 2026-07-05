/**
 * @file 块级语法拓展：脚注定义 + 脚注列表渲染
 * @module transformer/extends/block/footnoteDef
 *
 * 语法：`[^id]: 脚注内容`
 * 定义解析结果存入 ctx.store；finalize 编号并在 AST 末尾注入 footnotes 节点。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import type { ParserStore } from "@/transformer/core/ParserStore.js";

const FOOTNOTE_ITEMS_KEY = "footnoteItems";

interface FootnoteItem {
  id: string;
  num: number;
  children: MarkdownNode[];
}

function footnoteStoreKey(id: string): string {
  return `fn_${id}`;
}

function walkNodes(nodes: MarkdownNode[], fn: (node: MarkdownNode) => void): void {
  for (const node of nodes) {
    fn(node);
    if (node.children?.length) walkNodes(node.children, fn);
  }
}

function footnoteTargetId(num: number): string {
  return `footnote-${num}`;
}

function footnoteFirstRefId(num: number): string {
  return `footnote-ref-${num}`;
}

function appendFootnoteBackref(html: string, backref: string): string {
  const trimmed = html.trim();
  if (!trimmed) return `<p>${backref}</p>`;
  if (trimmed.endsWith("</p>")) {
    return trimmed.replace(/<\/p>\s*$/, ` ${backref}</p>`);
  }
  return `${trimmed}\n<p>${backref}</p>`;
}

function renderFootnotesSection(ctx: RenderContext, lineAttrs: string): string {
  const items = ctx.store.get<FootnoteItem[]>(FOOTNOTE_ITEMS_KEY);
  if (!items?.length) return "";

  const list = items
    .map((item) => {
      const inner = ctx.renderBlock(item.children);
      const backref = `<a href="#${footnoteFirstRefId(item.num)}" class="cherry-footnote-backref" aria-label="返回引用">↩︎</a>`;
      const body = appendFootnoteBackref(inner, backref);
      return `<li id="${footnoteTargetId(item.num)}" class="cherry-footnote-item">${body}</li>`;
    })
    .join("\n");

  return [
    `<div class="cherry-footnotes"${lineAttrs}>`,
    `<hr class="cherry-footnotes__sep">`,
    `<section class="cherry-footnotes__section">`,
    `<ol class="cherry-footnotes__list">`,
    list,
    `</ol>`,
    `</section>`,
    `</div>`,
  ].join("\n");
}

function finalizeFootnotes(
  root: MarkdownNode,
  ctx: BlockParseContext,
): MarkdownNode {
  const refs: MarkdownNode[] = [];
  walkNodes(root.children ?? [], (node) => {
    if (node.type === "footnote_ref") refs.push(node);
  });

  const idToNum = new Map<string, number>();
  const idToRefCount = new Map<string, number>();
  let num = 0;

  for (const node of refs) {
    const id = String(node.props?.id ?? "");
    if (!ctx.store.has(footnoteStoreKey(id))) continue;

    if (!idToNum.has(id)) {
      num += 1;
      idToNum.set(id, num);
    }

    const refIndex = (idToRefCount.get(id) ?? 0) + 1;
    idToRefCount.set(id, refIndex);

    node.props = {
      ...node.props,
      id,
      num: idToNum.get(id),
      refIndex,
    };
  }

  if (num === 0) return root;

  const items: FootnoteItem[] = [...idToNum.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id, n]) => {
      const children = ctx.store.get<MarkdownNode[]>(footnoteStoreKey(id)) ?? [];
      return { id, num: n, children };
    });

  ctx.store.set(FOOTNOTE_ITEMS_KEY, items);
  let lineIndex = 0;
  for (const child of root.children ?? []) {
    lineIndex += child.length > 0 ? child.length : 0;
  }
  root.children = [
    ...(root.children ?? []),
    createNode("footnotes", 0, undefined, undefined, {
      sourceStartLine: lineIndex,
      synthesized: true,
    }),
  ];
  return root;
}

const FOOTNOTE_FINALIZER = "footnotes";
const FOOTNOTE_FINALIZER_HOOK = "__footnoteFinalizerHook";

function ensureFootnoteFinalizer(store: ParserStore): void {
  if (store.has(FOOTNOTE_FINALIZER_HOOK)) return;
  store.set(FOOTNOTE_FINALIZER_HOOK, true);
  store.registerFinalizer(FOOTNOTE_FINALIZER, finalizeFootnotes);
}

function parseFootnoteHeader(line: string): { id: string; content: string } | null {
  if (!line) return null;

  let i = 0;
  while (i < 3 && line[i] === " ") i++;

  if (!line.startsWith("[^", i)) return null;

  const contentStart = i + 2;
  const closeIdx = line.indexOf("]:", contentStart);

  if (closeIdx === -1 || closeIdx === contentStart) return null;

  const afterColon = closeIdx + 2;

  if (afterColon === line.length) {
    return {
      id: line.substring(contentStart, closeIdx),
      content: "",
    };
  }

  const nextChar = line[afterColon];
  if (nextChar === " " || nextChar === "\t") {
    return {
      id: line.substring(contentStart, closeIdx),
      content: line.substring(afterColon + 1),
    };
  }

  return null;
}

export function parseFootnoteDefinition(lines: string[], index: number) {
  const line = lines[index];

  const header = parseFootnoteHeader(line ?? "");
  if (!header) return null;

  const bodyLines: string[] = [];
  if (header.content.length > 0) {
    bodyLines.push(header.content);
  }

  let i = index + 1;
  while (i < lines.length) {
    const ln = lines[i];
    if (ln.trim() === "") break;

    if (parseFootnoteHeader(ln) !== null) break;

    bodyLines.push(ln);
    i += 1;
  }

  let start = 0;
  let end = bodyLines.length;
  while (start < end && bodyLines[start].trim() === "") start += 1;
  while (end > start && bodyLines[end - 1].trim() === "") end -= 1;

  return {
    id: header.id,
    lines: bodyLines.slice(start, end),
    nextIndex: i,
  };
}

/** finalize 注入的脚注列表节点，不参与源码 parse */
class FootnotesSectionBlockParser extends BaseBlockParser {
  constructor() {
    super("footnotes", false);
  }

  canOpenAt(_lines: string[], _index: number, _ctx: BlockParseContext): boolean {
    return false;
  }

  parse(): null {
    return null;
  }

  render(node: MarkdownNode, ctx: RenderContext): string {
    return renderFootnotesSection(ctx, this.sourceLineAttrs(node));
  }
}

class FootnoteDefBlockParser extends BaseBlockParser {
  constructor() {
    super("footnote_def", false);
  }

  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return parseFootnoteHeader(lines[index] ?? "") !== null;
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const def = parseFootnoteDefinition(lines, index);
    if (!def) return null;

    ensureFootnoteFinalizer(ctx.store);

    const key = footnoteStoreKey(def.id);
    if (!ctx.store.has(key)) {
      ctx.store.set(key, ctx.parseBlocks(def.lines));
    }

    return { nextIndex: def.nextIndex };
  }

  render(): string {
    return "";
  }
}

export const footnotesSectionBlockParser = new FootnotesSectionBlockParser();
export default new FootnoteDefBlockParser();
