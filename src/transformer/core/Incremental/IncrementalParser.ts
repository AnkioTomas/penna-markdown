/**
 * @file Hash 边界增量 AST 解析器
 * @module transformer/core/Incremental/IncrementalParser
 *
 * ## 干什么
 *
 * 全量 parse 从 0 行扫到文档末尾。增量 parse 只 re-parse 变更区 markdown，
 * 再按 hash 边界拼回旧 AST。本类负责 **分区 → 局部 parse → 合并 → finalize → 原地写回**。
 *
 * ## 数据流
 *
 * ```
 * prevAst.children          reparsed（局部 parse）
 * ┌───┬───┬───┬───┐         ┌───┬───┐
 * │ A │ B │ C │ D │   +     │ B'│ C'│   （B/C 被编辑）
 * └───┴───┴───┴───┘         └───┴───┘
 *   ↑ prevHash              ↑ nextHash（均为未变块的 props.id）
 *
 * partition → before=[A]  middle=[B,C]  after=[D]
 * merge       → [A, B', C', D] 写回 prevAst
 * finalize    → 注入 synthesized 尾块（脚注等）
 * ```
 *
 * ## 操作类型判定
 *
 * | markdown | middle 块数 | type     |
 * |----------|-------------|----------|
 * | 空       | 任意        | delete   |
 * | 非空     | 0           | create   |
 * | 非空     | >0          | update   |
 *
 * ## hash 分区规则
 *
 * | prevHash | nextHash | before | middle | after |
 * |----------|----------|--------|--------|-------|
 * | `""`     | 非空     | `[]`   | `[0, nextIdx)` | `[nextIdx, …)` |
 * | 非空     | `""`     | `[0, prevIdx]` | `(prevIdx, …)` | `[]` |
 * | 非空     | 非空     | `[0, prevIdx]` | `(prevIdx, nextIdx)` | `[nextIdx, …)` |
 * | `""`     | `""`     | `[]`   | 全部 children | `[]` |
 *
 * ## 节点 props 约定
 *
 * - `id` — BlockParser 内容 hash（djb2 base36），作为 splice 锚点
 * - `parserStore` — 块 parse 时产生的全局状态，merge 时写入 ParserStore
 */

import { BlockParseEngine } from "@/transformer/core/BlockParser.js";
import { InlineParseEngine } from "@/transformer/core/InlineParser.js";
import { type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { ParserStore } from "@/transformer/core/ParserStore.js";
import type { Registry } from "@/transformer/core/Registry.js";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";
import type {
  IncrementalParseOp,
  IncrementalParseRange,
  IncrementalParseResult,
} from "@/transformer/core/Incremental/IncrementalParseRange.js";

/**
 * hash 边界分区结果。
 *
 * 将旧 AST 顶层 children 拆成三段：前缀保留、中间替换/删除、后缀保留。
 */
interface AstHashPartition {
  /** prevHash 锚点及之前的块（含锚点本身） */
  before: MarkdownNode[];
  /** 两锚点开区间之间的块；delete 时被移除，update 时被 reparsed 替换 */
  middle: MarkdownNode[];
  /** nextHash 锚点及之后的块（含锚点本身） */
  after: MarkdownNode[];
}

/**
 * Hash 边界增量 AST 解析器。
 *
 * 由 {@link TransformerEngine} 持有并在 {@link TransformerEngine.parseIncremental} 中调用。
 */
export class IncrementalParser {
  /** 语法注册表，用于创建局部 BlockParseEngine */
  private readonly registry: Registry;

  /**
   * @param registry 语法注册表，提供 Block/Inline 解析器及语法选项
   */
  constructor(registry: Registry) {
    this.registry = registry;
  }

  /**
   * 执行一次增量 parse：按 hash 边界 splice，原地更新 `prevAst`。
   *
   * 流程：
   * 1. {@link partitionAstByHash} — 按 prevHash/nextHash 拆分旧 AST
   * 2. {@link detectOp} — 判定 create / update / delete
   * 3. `BlockParseEngine.parseBlocks` — 仅 parse 变更区 markdown（delete 时跳过）
 * 4. {@link mergeChildren} — 拼接、合并 ParserStore，写回 prevAst
 * 5. `ParserStore.finalize` — 运行 finalizer（脚注列表等），原地修改 prevAst
 * 6. 更新 prevAst.props.store
   *
   * @param prevAst  上次 parse 的 root 节点；会被原地修改，对象引用不变
   * @param markdown 变更区 markdown 文本；支持已分行的 `string[]` 以避免二次切分；
   *                 空串 `""` 或空数组 `[]` 表示删除变更区
   * @param range    hash 边界，见 {@link IncrementalParseRange}
   * @returns 操作类型与受影响节点：
   *          - `delete` → `nodes` 为被移除的 middle 块
   *          - `create` / `update` → `nodes` 为新 parse 出的 reparsed 块
   * @throws 非空 prevHash/nextHash 在 AST 中找不到对应 `props.id`
   * @throws 两者均非空时 prevIdx >= nextIdx（锚点顺序非法）
   */
  parse(
    prevAst: MarkdownNode,
    markdown: string | string[],
    range: IncrementalParseRange,
  ): IncrementalParseResult {
    const lines = Array.isArray(markdown)
      ? markdown
      : normalizeMarkdownLines(markdown);
    const isDelete = markdown.length === 0;

    const partition = this.partitionAstByHash(
      prevAst.children ?? [],
      range.prevHash,
      range.nextHash,
    );
    const type = this.detectOp(isDelete, partition.middle.length);

    const { blockParser } = this.createBlockParseEngine(lines);
    const reparsed = type === "delete"
      ? []
      : blockParser.parseBlocks(lines);

    this.mergeChildren(prevAst, reparsed, partition, blockParser.store);
    blockParser.store.finalize(prevAst, blockParser.ctx);
    prevAst.length = this.sumChildrenLineLength(prevAst.children ?? []);
    prevAst.props = { store: blockParser.store };

    return {
      type,
      nodes: type === "delete" ? [...partition.middle] : reparsed,
    };
  }

  /**
   * 按 hash 边界拆分顶层 children 为 before / middle / after。
   *
   * @param children 旧 AST 顶层块数组（`prevAst.children`）
   * @param prevHash 前锚点块的 `props.id`；空串表示文档开头（before 为空）
   * @param nextHash 后锚点块的 `props.id`；空串表示文档末尾（after 为空）
   * @returns 三段分区结果
   * @throws 非空 prevHash 在 children 中找不到
   * @throws 非空 nextHash 在 children 中找不到
   * @throws prevHash、nextHash 均非空且 prevIdx >= nextIdx
   */
  private partitionAstByHash(
    children: MarkdownNode[],
    prevHash: string,
    nextHash: string,
  ): AstHashPartition {
    const hasPrev = prevHash.length > 0;
    const hasNext = nextHash.length > 0;

    if (!hasPrev && !hasNext) {
      return { before: [], middle: [...children], after: [] };
    }

    const prevIdx = hasPrev ? this.findBlockIndexByHash(children, prevHash) : -1;
    const nextIdx = hasNext ? this.findBlockIndexByHash(children, nextHash) : -1;

    if (hasPrev && prevIdx < 0) {
      throw new Error(`partitionAstByHash: prevHash not found: ${prevHash}`);
    }
    if (hasNext && nextIdx < 0) {
      throw new Error(`partitionAstByHash: nextHash not found: ${nextHash}`);
    }
    if (hasPrev && hasNext && prevIdx >= nextIdx) {
      throw new Error(
        `partitionAstByHash: invalid range prevIdx=${prevIdx} nextIdx=${nextIdx}`,
      );
    }

    if (!hasPrev && hasNext) {
      return {
        before: [],
        middle: children.slice(0, nextIdx),
        after: children.slice(nextIdx),
      };
    }

    if (hasPrev && !hasNext) {
      return {
        before: children.slice(0, prevIdx + 1),
        middle: children.slice(prevIdx + 1),
        after: [],
      };
    }

    return {
      before: children.slice(0, prevIdx + 1),
      middle: children.slice(prevIdx + 1, nextIdx),
      after: children.slice(nextIdx),
    };
  }

  /**
   * 在顶层 children 中按 `props.id` 查找块索引。
   *
   * @param children 待查找的顶层块数组
   * @param hash     目标块的内容 hash（`props.id`）
   * @returns 首个匹配块的 0-based 索引；未找到返回 `-1`
   */
  private findBlockIndexByHash(children: MarkdownNode[], hash: string): number {
    for (let i = 0; i < children.length; i++) {
      const node = children[i]!;
      if (node.props?.id === hash) return i;
    }
    return -1;
  }

  /**
   * 判定本次增量操作类型。
   *
   * @param isDelete    markdown 是否为空（空串或空数组）
   * @param middleCount partition.middle 的块数
   * @returns `"delete"` | `"create"` | `"update"`
   */
  private detectOp(isDelete: boolean, middleCount: number): IncrementalParseOp {
    if (isDelete) return "delete";
    if (middleCount === 0) return "create";
    return "update";
  }

  /**
   * 拼接 before + reparsed + after，合并 ParserStore，写回 `prevAst`。
   *
   * @param prevAst   旧 AST root；`children` / `length` 会被原地更新
   * @param reparsed  局部 parse 产出的新块（delete 时为空数组）
   * @param partition hash 分区结果，取 before/after 与 reparsed 拼接
   * @param store     本次局部 parse 创建的 ParserStore（初始为空，由 {@link syncParserStoreFromAst} 补状态）
   */
  private mergeChildren(
    prevAst: MarkdownNode,
    reparsed: MarkdownNode[],
    partition: AstHashPartition,
    store: ParserStore,
  ): void {
    const { before, after } = partition;
    const merged = [...before, ...reparsed, ...after];
    
    // 如果没有任何保留的旧块，说明是全文替换，不应当继承旧的 store 状态
    const isFullReplace = before.length === 0 && after.length === 0;
    this.syncParserStoreFromAst(prevAst, merged, store, isFullReplace);
    
    prevAst.children = merged;
    prevAst.length = 0;
  }

  /**
   * 创建局部 BlockParseEngine，绑定独立 ParserStore。
   *
   * 增量 parse 使用全新 store，旧状态通过 {@link syncParserStoreFromAst} 从 prevAst 补回。
   *
   * @param lines 变更区源码行数组，用于初始化 ParserStore 及块级 parse
   * @returns 配置完毕的 BlockParseEngine 实例
   */
  private createBlockParseEngine(lines: string[]): { blockParser: BlockParseEngine } {
    const store = new ParserStore(lines);
    const inlineParser = new InlineParseEngine(this.registry, store);
    const blockParser = new BlockParseEngine(
      this.registry,
      store,
      (text) => inlineParser.parse(text),
    );
    return { blockParser };
  }

  /**
   * 读取节点 `props.parserStore`  payload。
   *
   * @param node AST 块节点
   * @returns 键值对象；格式不对（非 object / 数组）时返回 `null`
   */
  private readParserStorePayload(
    node: MarkdownNode,
  ): Record<string, unknown> | null {
    const payload = node.props?.parserStore;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }
    return payload as Record<string, unknown>;
  }

  /**
   * 将 AST 节点上的 `props.parserStore` 键值写入 ParserStore。
   *
   * @param children  待读取的块数组
   * @param store     目标 ParserStore
   * @param overwrite 是否强制覆盖已有键；默认 `false`（先出现的赢）
   */
  private applyParserStoreFromNodes(
    children: MarkdownNode[],
    store: ParserStore,
    overwrite = false,
  ): void {
    for (const node of children) {
      const payload = this.readParserStorePayload(node);
      if (!payload) continue;

      for (const [key, value] of Object.entries(payload)) {
        if (overwrite || !store.has(key)) {
          store.set(key, value);
        }
      }
    }
  }

  /**
   * 把 splice 后的全局状态补进本次局部 parse 创建的空 ParserStore。
   *
   * **为什么需要？** 增量 parse 每次 `new ParserStore(lines)`，store 初始为空。
   * 但文档级状态（frontmatter、脚注定义、slug 计数等）分散在：
   * - 各块 `props.parserStore`（parse 时写入）
   * - 上次 root 的 `props.store` 快照
   *
   * finalize / 渲染依赖这些键，merge 后必须补回，否则 before/after 未重 parse 的块会丢状态。
   *
   * 写入顺序（只填空键，不覆盖已有键）：
   * 1. merged — 拼接结果中各块的 `props.parserStore`（含 reparsed 新状态）
   * 2. prevAst.props.store — 上次 parse 的 store 快照（兜底未挂在块上的键）
   *
   * @param prevAst        旧 AST root，读取 `props.store` 快照
   * @param mergedChildren splice 后的顶层块数组
   * @param store          本次局部 parse 创建的空 ParserStore
   */
  private syncParserStoreFromAst(
    prevAst: MarkdownNode,
    mergedChildren: MarkdownNode[],
    store: ParserStore,
    isFullReplace: boolean,
  ): void {
    this.applyParserStoreFromNodes(mergedChildren, store);

    if (isFullReplace) return;

    const prevStore = prevAst.props?.store as ParserStore | undefined;
    if (!prevStore) return;

    for (const [key, value] of Object.entries(prevStore.getAll())) {
      if (!store.has(key)) store.set(key, value);
    }
  }

  /**
   * 累加顶层 children 的 `length`（块级 length = 吞掉的源码行数）。
   *
   * @param children 顶层块数组
   * @returns 文档总行数，用于设置 root.length
   */
  private sumChildrenLineLength(children: MarkdownNode[]): number {
    let total = 0;
    for (const child of children) {
      total += child.length > 0 ? child.length : 0;
    }
    return total;
  }
}
