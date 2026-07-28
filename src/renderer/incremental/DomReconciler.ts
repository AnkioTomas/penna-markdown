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
 *
 * ## DOM 更新
 *
 * 使用 {@link syncMountOrder} 最小化 DOM 操作：顺序未变时不移动节点，
 * 避免 iframe/video 因 detach 重载。不可 parse 的块跳过（与全量渲染一致）。
 *
 * 定义块（`globalEffect`）编辑时由 {@link IncrementalSession} 降级全量渲染，本模块不做特判。
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { TransformerEngine } from "@/transformer/TransformerEngine.js";
import {
  BLOCK_HASH_ATTR,
  BlockIndex,
  lookupByHashPrefix,
  stripHashAttr,
} from "@/renderer/incremental/BlockIndex";

/** {@link reconcileDom} 的返回值。 */
export interface DomReconcileResult {
  /** 是否成功完成 reconcile */
  ok: boolean;
  /** 与 `mount.children` 顺序一致的块索引 */
  blocks: BlockIndex[];
  /** 新建/替换或行号漂移的块起始行（0-based，供 scroll-sync / 事件） */
  changedStartLines: number[];
  /** DOM 被新建/替换的块数；仅行号漂移的复用块不计入 */
  replacedCount: number;
  /** 失败原因（`ok === false` 时） */
  failReason?: string;
}

/** {@link reconcileDom} 的可选参数。 */
export interface DomReconcileOptions {
  /** 上次渲染的块索引，用于行号漂移检测 */
  prevBlocks?: BlockIndex[];
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

/** `prevBlocks[i]` 与 `mount.children[i]` 的配对，供按渲染内容复用。 */
interface PrevPair {
  el: HTMLElement;
  prev: BlockIndex;
}

/**
 * 按上次的 `renderedHtml` 建索引：渲染内容 → 旧 DOM 队列。
 *
 * `prevBlocks` 与 `mount.children` 严格一一对应（调用方已校验长度），
 * 故按下标配对。重复内容的块用队列保序取用。
 */
function buildHtmlPool(
  mount: HTMLElement,
  prevBlocks: BlockIndex[],
): Map<string, PrevPair[]> {
  const byHtml = new Map<string, PrevPair[]>();
  if (prevBlocks.length !== mount.childElementCount) return byHtml;

  for (let i = 0; i < prevBlocks.length; i++) {
    const prev = prevBlocks[i]!;
    if (!prev.renderedHtml) continue;
    const el = mount.children[i] as HTMLElement;
    const queue = byHtml.get(prev.renderedHtml);
    if (queue) queue.push({ el, prev });
    else byHtml.set(prev.renderedHtml, [{ el, prev }]);
  }
  return byHtml;
}

/**
 * 取一个渲染内容相同、且尚未被占用的旧节点。
 *
 * 不能用 `pool` 判可用：finalizer 生成的块（如 footnotes）没有 `props.id`，
 * 其 DOM 上也就没有 `data-hash`，压根不在 pool 里——那正是最需要复用的一类。
 */
function takeTwin(
  byHtml: Map<string, PrevPair[]>,
  pool: Map<string, HTMLElement>,
  consumed: Set<HTMLElement>,
  rendered: string,
): PrevPair | undefined {
  const queue = byHtml.get(rendered);
  while (queue?.length) {
    const pair = queue.shift()!;
    if (consumed.has(pair.el)) continue;

    // 取走后要同步从 pool 摘除，否则末尾的 leftover 清理会把它删掉
    const key = pair.el.getAttribute(BLOCK_HASH_ATTR);
    if (key && pool.get(key) === pair.el) pool.delete(key);

    consumed.add(pair.el);
    return pair;
  }
  return undefined;
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
 * @param options     可选：上次块索引
 */
export function reconcileDom(
  mount: HTMLElement,
  ast: MarkdownNode,
  transformer: TransformerEngine,
  options: DomReconcileOptions = {},
): DomReconcileResult {
  const { prevBlocks = [] } = options;

  const pool = buildDomPool(mount);
  const prevByHash = prevBlockByHash(prevBlocks);
  const byHtml = buildHtmlPool(mount, prevBlocks);
  const consumed = new Set<HTMLElement>();

  const ordered: HTMLElement[] = [];
  const blocks: BlockIndex[] = [];
  const changedStartLines: number[] = [];
  const doc = mount.ownerDocument;
  let replacedCount = 0;

  const keepNode = (
    el: HTMLElement,
    block: BlockIndex,
    prev: BlockIndex | undefined,
    renderedHtml: string,
  ): void => {
    syncHashAttr(el, block.hash);
    if (
      prev &&
      (prev.startLine !== block.startLine || prev.endLine !== block.endLine)
    ) {
      changedStartLines.push(block.startLine);
    }
    ordered.push(el);
    blocks.push(block.withRenderedHtml(renderedHtml));
  };

  for (const block of BlockIndex.fromAst(ast)) {
    const hash = block.hash;

    if (hash) {
      const reused = lookupByHashPrefix(pool, hash, true);
      if (reused) {
        consumed.add(reused);
        const prev = lookupByHashPrefix(prevByHash, hash);
        // 复用块内容未变，renderedHtml 继承自上次；供后续按内容比较。
        keepNode(reused, block, prev, prev?.renderedHtml ?? "");
        continue;
      }
    }

    const html = transformer.renderBlock(block.node, ast);
    const rendered = stripHashAttr(html.trim());

    // hash 变了不代表渲染结果变了：脏区一并重解析的邻块拿到新 hash，
    // 但渲染内容与上次完全相同。此时必须复用旧节点，否则 img/iframe/video
    // 每次 append 都被重建，浏览器要重新请求并解码资源。
    if (rendered) {
      const twin = takeTwin(byHtml, pool, consumed, rendered);
      if (twin) {
        keepNode(twin.el, block, twin.prev, rendered);
        continue;
      }
    }

    const fresh = BlockIndex.parseSingleRootHtml(doc, html);
    if (!fresh) continue;

    syncHashAttr(fresh, hash);
    ordered.push(fresh);
    blocks.push(block.withRenderedHtml(rendered));
    changedStartLines.push(block.startLine);
    replacedCount++;
  }

  for (const leftover of pool.values()) leftover.remove();

  syncMountOrder(mount, ordered);

  return { ok: true, blocks, changedStartLines, replacedCount };
}

/**
 * 全量 parse 后的 DOM reconcile：按 `renderBlock` 内容复用节点，替代 `replaceChildren`。
 *
 * 与 {@link reconcileDom} 的区别：**逐块重渲染**并按剥离 `data-hash` 后的
 * 渲染 HTML 比较，仅当内容真正相同才复用旧节点。这样即便 hash 未变但渲染依赖
 * globalEffect store（frontmatter 变量、脚注引用）而变化，也能正确替换；
 * 反之未变块（含挂载后被客户端增强的图表/代码块）保留原节点，不闪、不重载媒体。
 *
 * 全量降级（`full-replace` / `global-effect` / 首次挂载）统一走此路径。
 * `mount` 为空 + `prevBlocks` 为空时等价全新挂载。
 *
 * @param mount      预览区挂载点
 * @param ast        全量 parse 的 AST 根
 * @param renderPart 共享 ctx 下渲染单块 HTML（与全量一致）
 * @param prevBlocks 上次挂载的块索引（含 `renderedHtml`）
 */
export function reconcileDomFull(
  mount: HTMLElement,
  ast: MarkdownNode,
  renderPart: (node: MarkdownNode) => string,
  prevBlocks: BlockIndex[] = [],
): DomReconcileResult {
  const pool = buildDomPool(mount);
  const byHtml = buildHtmlPool(mount, prevBlocks);
  const consumed = new Set<HTMLElement>();

  const ordered: HTMLElement[] = [];
  const blocks: BlockIndex[] = [];
  const changedStartLines: number[] = [];
  const doc = mount.ownerDocument;
  let replacedCount = 0;

  for (const block of BlockIndex.fromAst(ast)) {
    const hash = block.hash;
    const rawHtml = renderPart(block.node);
    const rendered = stripHashAttr(rawHtml.trim());

    // 判据只有一个：渲染内容是否与某个旧节点相同。
    // 不看 hash——finalizer 生成的块（footnotes）根本没有 hash，
    // 而 hash 相同也不代表渲染相同（globalEffect store 会变）。
    if (rendered) {
      const twin = takeTwin(byHtml, pool, consumed, rendered);
      if (twin) {
        syncHashAttr(twin.el, hash);
        if (
          twin.prev.startLine !== block.startLine ||
          twin.prev.endLine !== block.endLine
        ) {
          changedStartLines.push(block.startLine);
        }
        ordered.push(twin.el);
        blocks.push(block.withRenderedHtml(rendered));
        continue;
      }
    }

    const fresh = BlockIndex.parseSingleRootHtml(doc, rawHtml);
    if (!fresh) continue;

    syncHashAttr(fresh, hash);
    ordered.push(fresh);
    blocks.push(block.withRenderedHtml(rendered));
    changedStartLines.push(block.startLine);
    replacedCount++;
  }

  for (const leftover of pool.values()) leftover.remove();

  syncMountOrder(mount, ordered);

  return { ok: true, blocks, changedStartLines, replacedCount };
}
