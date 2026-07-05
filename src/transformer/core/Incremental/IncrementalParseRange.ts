/**
 * @file 增量 parse 类型定义
 * @module transformer/core/Incremental/IncrementalParseRange
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";

/**
 * 增量 parse 的 hash 边界。
 *
 * `prevHash` / `nextHash` 指向编辑后文档中**未变**块的 `props.id`（BlockParser 内容 hash）。
 * 变更区为两锚点之间的块；局部 re-parse 的 `markdown` 仅覆盖该区。
 *
 * | prevHash | nextHash | 变更区位置 |
 * |----------|----------|------------|
 * | `""`     | 非空     | 文档开头 → nextHash 之前 |
 * | 非空     | `""`     | prevHash 之后 → 文档末尾 |
 * | 非空     | 非空     | 两锚点之间（不含锚点本身） |
 * | `""`     | `""`     | 全文 |
 *
 * @example 修改 B、C 两块（A、D 未变）
 * ```ts
 * { prevHash: idOfA, nextHash: idOfD }
 * ```
 *
 * @example 在 A 与 B 之间插入
 * ```ts
 * { prevHash: idOfA, nextHash: idOfB }
 * ```
 *
 * @example 在文档末尾追加
 * ```ts
 * { prevHash: idOfLastBlock, nextHash: "" }
 * ```
 */
export interface IncrementalParseRange {
  /** 变更区前一个未变块的 hash；`""` = 文档开头 */
  prevHash: string;
  /** 变更区后一个未变块的 hash；`""` = 文档末尾 */
  nextHash: string;
}

/**
 * 增量 parse 操作类型。
 *
 * - `delete` — `markdown` 为空，移除 prevHash 与 nextHash 之间的块
 * - `create` — 有增量文本且中间无旧块，在锚点间插入新块
 * - `update` — 有增量文本且中间有旧块，替换中间块
 */
export type IncrementalParseOp = "create" | "update" | "delete";

/**
 * {@link IncrementalParser.parse} 的返回值。
 */
export interface IncrementalParseResult {
  /** 本次增量操作类型 */
  type: IncrementalParseOp;
  /**
   * 受影响的 AST 块。
   * - `delete` → 被移除的中间块（middle）
   * - `create` / `update` → 新 parse 出的块（reparsed）
   */
  nodes: MarkdownNode[];
}
