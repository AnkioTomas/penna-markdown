/**
 * @file 预览区 DOM hash 对齐
 * @module renderer/incremental/DomReconciler
 *
 * 按 `data-hash` 复用 DOM 节点；仅对无法复用或内容变更的块调用 `renderBlock`。
 * reconcile 完成后输出与 `mount.children` 对齐的 {@link BlockIndex}[]。
 *
 * ## 复用策略
 *
 * 1. 精确 `data-hash` 匹配 pool 中旧节点
 * 2. 否则按 {@link contentHashPrefix} 匹配（reparse 随机后缀变化、内容未变）
 * 3. frontmatter 编辑时，含 `frontmatter_var` 的块强制重渲染
 *
 * ## DOM 更新
 *
 * 使用 {@link syncMountOrder} 最小化 DOM 操作：顺序未变时不移动节点，
 * 避免 iframe/video 因 detach 重载。不可 parse 的块跳过（与全量渲染一致）。
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { TransformerEngine } from "@/transformer/TransformerEngine.js";
import {
  BLOCK_HASH_ATTR,
  BlockIndex,
  lookupByHashPrefix,
} from "./BlockIndex.js";

/** {@link reconcileDom} 的返回值。 */
export interface DomReconcileResult {
  /** 是否成功完成 reconcile */
  ok: boolean;
  /** 与 `mount.children` 顺序一致的块索引 */
  blocks: BlockIndex[];
  /** 新建/替换或行号漂移的块起始行（0-based，供 scroll-sync / 事件） */
  changedStartLines: number[];
  /** 失败原因（`ok === false` 时） */
  failReason?: string;
}

/** {@link reconcileDom} 的可选参数。 */
export interface DomReconcileOptions {
  /** frontmatter 被编辑时为 `true`，含 `[[var]]` 的块强制重渲染 */
  frontmatterEdited?: boolean;
  /** 上次渲染的块索引，用于行号漂移检测 */
  prevBlocks?: BlockIndex[];
}

/** 递归判断 AST 子树是否含 `frontmatter_var` 节点。 */
function hasFrontmatterVar(node: MarkdownNode): boolean {
  if (node.type === "frontmatter_var") return true;
  for (const child of node.children ?? []) {
    if (hasFrontmatterVar(child)) return true;
  }
  return false;
}

/**
 * 从 mount 现有子元素构建 hash → DOM 映射 pool。
 *
 * @param mount 预览区挂载点
 * @returns 无 `data-hash` 的子元素不进入 pool
 */
function buildDomPool(mount: HTMLElement): Map<string, HTMLElement> {
  const pool = new Map<string, HTMLElement>();
  for (const child of mount.children) {
    const el = child as HTMLElement;
    const hash = el.getAttribute(BLOCK_HASH_ATTR);
    if (!hash) continue;
    pool.set(hash, el);
  }
  return pool;
}

/** 同步元素上的 `data-hash` 属性（reparse 后 id 变化时更新）。 */
function syncHashAttr(el: HTMLElement, hash: string): void {
  if (hash && el.getAttribute(BLOCK_HASH_ATTR) !== hash) {
    el.setAttribute(BLOCK_HASH_ATTR, hash);
  }
}

/** 将 `prevBlocks` 转为 hash → BlockIndex 映射（仅精确 hash）。 */
function prevBlockByHash(prevBlocks: BlockIndex[]): Map<string, BlockIndex> {
  const map = new Map<string, BlockIndex>();
  for (const block of prevBlocks) {
    if (block.hash) map.set(block.hash, block);
  }
  return map;
}

/** 判断 mount 子元素顺序是否与目标序列一致（引用相等）。 */
function mountOrderMatches(
  mount: HTMLElement,
  ordered: HTMLElement[],
): boolean {
  if (mount.childElementCount !== ordered.length) return false;
  for (let i = 0; i < ordered.length; i++) {
    if (mount.children[i] !== ordered[i]) return false;
  }
  return true;
}

/**
 * 最小化同步 mount 子元素顺序。
 *
 * 顺序已一致时 no-op；否则 remove 多余节点 + insertBefore 错位项。
 * 不使用 `replaceChildren`，避免复用节点被 detach 导致 iframe/video 重载。
 *
 * @param mount   预览区挂载点
 * @param ordered 目标 DOM 序列
 */
function syncMountOrder(mount: HTMLElement, ordered: HTMLElement[]): void {
  if (mountOrderMatches(mount, ordered)) return;

  const orderedSet = new Set(ordered);
  for (const child of [...mount.children]) {
    if (!orderedSet.has(child as HTMLElement)) {
      (child as HTMLElement).remove();
    }
  }

  for (let i = 0; i < ordered.length; i++) {
    const el = ordered[i]!;
    if (mount.children[i] !== el) {
      mount.insertBefore(el, mount.children[i] ?? null);
    }
  }
}

/**
 * hash 键 DOM reconcile：复用未变块，渲染变更块，重建 BlockIndex。
 *
 * @param mount       预览区挂载点
 * @param ast         增量 parse 后的 AST 根
 * @param transformer 渲染引擎
 * @param options     可选：frontmatter 编辑标志、上次块索引
 */
export function reconcileDom(
  mount: HTMLElement,
  ast: MarkdownNode,
  transformer: TransformerEngine,
  options: DomReconcileOptions = {},
): DomReconcileResult {
  const { frontmatterEdited = false, prevBlocks = [] } = options;

  const pool = buildDomPool(mount);
  const prevByHash = prevBlockByHash(prevBlocks);

  const ordered: HTMLElement[] = [];
  const blocks: BlockIndex[] = [];
  const changedStartLines: number[] = [];
  const doc = mount.ownerDocument;

  for (const block of BlockIndex.fromAst(ast)) {
    const hash = block.hash;
    const forceRender = frontmatterEdited && hasFrontmatterVar(block.node);

    if (!forceRender && hash) {
      const reused = lookupByHashPrefix(pool, hash, true);
      if (reused) {
        const prev = lookupByHashPrefix(prevByHash, hash);
        syncHashAttr(reused, hash);
        if (
          prev &&
          (prev.startLine !== block.startLine || prev.endLine !== block.endLine)
        ) {
          changedStartLines.push(block.startLine);
        }
        ordered.push(reused);
        blocks.push(block);
        continue;
      }
    }

    const html = transformer.renderBlock(block.node, ast);
    const fresh = BlockIndex.parseSingleRootHtml(doc, html);
    if (!fresh) continue;

    syncHashAttr(fresh, hash);
    ordered.push(fresh);
    blocks.push(block);
    changedStartLines.push(block.startLine);
  }

  for (const leftover of pool.values()) leftover.remove();

  syncMountOrder(mount, ordered);

  return { ok: true, blocks, changedStartLines };
}
