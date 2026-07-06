/**
 * @file CodeMirror 编辑变更行号
 * @module renderer/incremental/CherryChangeSet
 *
 * Preview 从 CM {@link Transaction} 提取的行级变更描述，
 * 供 {@link HashBoundaryResolver} 脏区计算与增量 parse 使用。
 *
 * ## 行号约定
 *
 * 一律 **1-based**，首尾均含（与 CM `lineAt` 一致）。
 * {@link HashBoundaryResolver} 内部会转换为 0-based 半开区间。
 */

/**
 * CM Transaction 反馈的单段行变更。
 *
 * @example 替换第 3 行
 * ```ts
 * { fromA: 3, toA: 3, fromB: 3, toB: 3 }
 * ```
 *
 * @example 在第 1 行前插入 2 行（纯插入）
 * ```ts
 * { fromA: 1, toA: 0, fromB: 1, toB: 2 }
 * ```
 */
export interface CherryChangeLineSet {
  /** 旧文档变更起始行（1-based，含） */
  fromA: number;
  /** 旧文档变更结束行（1-based，含）；纯插入时 `toA < fromA` */
  toA: number;
  /** 新文档变更起始行（1-based，含） */
  fromB: number;
  /** 新文档变更结束行（1-based，含） */
  toB: number;
}
