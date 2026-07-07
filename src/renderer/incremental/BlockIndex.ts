/**
 * @file 块级索引（hash ↔ 源码行号）
 * @module renderer/incremental/BlockIndex
 *
 * 与 `mount.children` 一一对应；`hash` 对齐 DOM `data-hash`，
 * `startLine`/`endLine` 供 scroll-sync 消费。
 *
 * hash 边界计算见 {@link HashBoundaryResolver} 内 `astBlockSpans`，
 * 本模块不参与 `parseIncremental` 锚点。
 *
 * ## 不变量（scroll-sync 依赖）
 *
 * - `blocks.length === mount.childElementCount`
 * - `blocks[i]` 与 `mount.children[i]` 的 `data-hash` 一致
 * - 增量成功后行号从**新 AST** 重建，不复用旧条目
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { countTopLevelDomRoots } from "@/transformer/utils/sourceLine.js";

/** 块级渲染器在根元素上输出的内容 hash 属性，值等于 `MarkdownNode.props.id`。 */
export const BLOCK_HASH_ATTR = "data-hash";

/**
 * 提取块 id 的内容 hash 前缀（`djb2_` 部分，含末尾 `_`）。
 *
 * BlockParser 的 id 格式为 `{contentHash}_{random16}`。
 * reparse 后随机后缀变化时，仍可通过前缀匹配复用 DOM。
 *
 * @param hash 完整 `props.id` / `data-hash` 值
 * @returns 前缀；无 `_` 时返回原串
 */
export function contentHashPrefix(hash: string): string {
  const i = hash.indexOf("_");
  return i > 0 ? hash.slice(0, i + 1) : hash;
}

/** 顶层块行 walk 条目（0-based 半开 `[startLine, endLine)`）。 */
export interface TopLevelBlockLine {
  readonly node: MarkdownNode;
  readonly hash: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly childIndex: number;
}

/**
 * 遍历 `ast.children`，统一计算 hash 与行区间。
 *
 * @param ast 文档 AST 根
 */
export function iterateTopLevelLines(ast: MarkdownNode): TopLevelBlockLine[] {
  const items: TopLevelBlockLine[] = [];
  let lineIndex = 0;

  for (let i = 0; i < (ast.children ?? []).length; i++) {
    const node = ast.children![i]!;
    const span = node.length > 0 ? node.length : 0;
    const startLine = lineIndex;
    const endLine = startLine + span;
    const hash = typeof node.props?.id === "string" ? node.props.id : "";

    items.push({ node, hash, startLine, endLine, childIndex: i });
    lineIndex += span;
  }

  return items;
}

/**
 * 在 `Map<hash, T>` 中按精确 hash 或 {@link contentHashPrefix} 查找。
 *
 * @param map           hash 键映射
 * @param hash          目标 hash
 * @param removeOnMatch 命中后是否从 map 删除（DOM pool 复用时为 `true`）
 */
export function lookupByHashPrefix<T>(
  map: Map<string, T>,
  hash: string,
  removeOnMatch = false,
): T | undefined {
  const exact = map.get(hash);
  if (exact) {
    if (removeOnMatch) map.delete(hash);
    return exact;
  }

  const prefix = contentHashPrefix(hash);
  if (prefix === hash) return undefined;

  for (const [key, value] of map) {
    if (!key.startsWith(prefix)) continue;
    if (removeOnMatch) map.delete(key);
    return value;
  }

  return undefined;
}

/**
 * 块级索引条目。
 *
 * 数组顺序与预览区 `mount.children` 一致（仅含实际挂载的可见块）。
 */
export class BlockIndex {
  /**
   * 从 AST 根节点提取可见块的 hash 与行号映射。
   *
   * - 跳过 `invisible` / `blank_line`
   * - 不调用 `renderBlock`，不判定 HTML 是否可挂载
   *
   * @param ast 文档 AST 根节点
   */
  static fromAst(ast: MarkdownNode): BlockIndex[] {
    const entries: BlockIndex[] = [];

    for (const {
      node,
      hash,
      startLine,
      endLine,
      childIndex,
    } of iterateTopLevelLines(ast)) {
      if (node.props?.invisible || node.type === "blank_line") continue;
      entries.push(new BlockIndex(hash, startLine, endLine, node.type, node));
    }

    return entries;
  }

  /**
   * 将 HTML 解析为恰好一个元素根节点（深拷贝，未插入文档）。
   *
   * 使用 `<template>` 惰性文档片段解析，避免在 `div.innerHTML` 阶段触发
   * img/video/audio/iframe 等资源请求；资源加载推迟到节点插入 mount 之后。
   *
   * 以浏览器解析为准：regex 判定为单根但 HTML 非法嵌套（如 `<a>` 内嵌 `<a>`）
   * 时返回 `null`（与 {@link isMountedHtml} 在传入 `doc` 时行为一致）。
   *
   * @param doc  所属文档，用于创建 `<template>`
   * @param html 单块 `renderBlock` 产出的 HTML
   * @returns 克隆后的根元素；不可挂载时返回 `null`
   */
  static parseSingleRootHtml(doc: Document, html: string): HTMLElement | null {
    const trimmed = html.trim();

    const template = doc.createElement("template");
    template.innerHTML = trimmed;
    const root = template.content.firstElementChild;
    if (!root || template.content.childElementCount !== 1) return null;

    return root.cloneNode(true) as HTMLElement;
  }

  /**
   * 全量挂载：共享渲染上下文逐块产出 HTML，小块 template 解析后 append。
   *
   * 比 `transformer.render(ast)` + 整段 `innerHTML` 更快：
   * 只渲染 {@link fromAst} 可见块，且每块独立小 DOM 解析。
   *
   * @param doc        所属文档
   * @param ast        文档 AST 根
   * @param mount      预览挂载点（调用方应先 `replaceChildren`）
   * @param renderPart 在共享 ctx 下渲染单块 HTML
   */
  static mountFromAstWithContext(
    ast: MarkdownNode,
    doc: Document,
    mount: HTMLElement,
    renderPart: (node: MarkdownNode) => string,
  ): { html: string; mountedBlocks: BlockIndex[] } {
    const mountedBlocks: BlockIndex[] = [];
    const htmlParts: string[] = [];

    for (const block of BlockIndex.fromAst(ast)) {
      const part = renderPart(block.node);
      const trimmed = part.trim();
      const el = BlockIndex.parseSingleRootHtml(doc, part);
      if (!el) continue;

      mount.appendChild(el);
      mountedBlocks.push(block);
      htmlParts.push(trimmed);
    }

    return {
      html: htmlParts.length > 0 ? `${htmlParts.join("\n")}\n` : "",
      mountedBlocks,
    };
  }

  /**
   * 判断渲染 HTML 是否可挂载到预览区（恰好一个元素根）。
   *
   * @param html 单块渲染 HTML
   * @param doc  若提供，用 {@link parseSingleRootHtml} 判定（准确）；
   *             否则用 regex 统计顶层根（轻量，可能与浏览器不一致）
   */
  static isMountedHtml(html: string, doc?: Document): boolean {
    const trimmed = html.trim();
    if (!trimmed) return false;

    if (doc) {
      return BlockIndex.parseSingleRootHtml(doc, html) !== null;
    }

    if (trimmed[0] !== "<" || trimmed[trimmed.length - 1] !== ">") {
      return false;
    }

    return countTopLevelDomRoots(trimmed) === 1;
  }

  /**
   * @param hash      块内容 hash，等于 `node.props.id`
   * @param startLine 源码起始行（0-based，含）
   * @param endLine   源码结束行（0-based，不含）
   * @param type      AST 节点类型
   * @param node      对应 AST 顶层块节点
   */
  constructor(
    readonly hash: string,
    readonly startLine: number,
    readonly endLine: number,
    readonly type: string,
    readonly node: MarkdownNode,
  ) {}
}
