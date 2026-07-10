/**
 * @file hash 边界解析（对齐 IncrementalParser）
 * @module renderer/incremental/HashBoundaryResolver
 *
 * 将 CM 行变更转换为 {@link IncrementalParseRange} + markdown 切片，
 * 调用 {@link TransformerEngine.parseIncremental}。
 *
 * 锚点基于 **全 AST children**（{@link astBlockSpans}），不用 {@link BlockIndex}。
 *
 * ## 数据流
 *
 * ```
 * CherryChangeLineSet[]
 *       ↓ dirtyLinesFromChanges + expandDirtyToBlockBounds
 * astBlockSpans → prevHash / nextHash
 *       ↓ mapOldLineToNew + slice
 * { range, markdown } → parseIncremental
 * ```
 *
 * hash 分区语义与 {@link IncrementalParser.partitionAstByHash} 一致，
 * 见 {@link IncrementalParseRange}。
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { TransformerEngine } from "@/transformer/TransformerEngine.js";
import type {
  IncrementalParseRange,
  IncrementalParseResult,
} from "@/transformer/core/Incremental/IncrementalParseRange.js";
import type { CherryChangeLineSet } from "@/renderer/incremental/CherryChangeSet";
import { iterateTopLevelLines } from "@/renderer/incremental/BlockIndex";

/**
 * 单个 AST 顶层块的行区间与 hash（hash 边界专用，含 invisible 块）。
 *
 * 行号为 0-based 半开区间 `[startLine, endLine)`。
 * DOM / scroll-sync 用 {@link BlockIndex}，不用本类型。
 */
export interface AstBlockSpan {
  readonly node: MarkdownNode;
  readonly hash: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly childIndex: number;
}

/** 从 AST 根提取全量顶层块 span（含 invisible）。 */
export function astBlockSpans(ast: MarkdownNode): AstBlockSpan[] {
  return iterateTopLevelLines(ast);
}

/** 判断块行区间是否与脏区相交。 */
export function spanOverlapsDirty(
  span: AstBlockSpan,
  startLine: number,
  endLine: number,
): boolean {
  return span.startLine < endLine && span.endLine > startLine;
}

/** 找与脏区相交的连续 span 索引闭区间；无相交时 `null`。 */
export function findAffectedSpanRange(
  spans: AstBlockSpan[],
  startLine: number,
  endLine: number,
): { startIdx: number; endIdx: number } | null {
  let startIdx = -1;
  let endIdx = -1;

  for (let i = 0; i < spans.length; i++) {
    if (!spanOverlapsDirty(spans[i]!, startLine, endLine)) continue;
    if (startIdx < 0) startIdx = i;
    endIdx = i;
  }

  return startIdx < 0 ? null : { startIdx, endIdx };
}

/** 传给 {@link TransformerEngine.parseIncremental} 的输入。 */
export interface HashBoundaryInput {
  /** hash 边界，锚定未变块 */
  range: IncrementalParseRange;
  /** 变更区 markdown；空串/空数组表示 delete */
  markdown: string | string[];
}

/** {@link resolveHashBoundaryInternal} 的返回值。 */
export interface HashBoundaryResolveResult {
  /** parseIncremental 输入 */
  input: HashBoundaryInput;
  /** 旧文档侧脏区（0-based 半开 `[startLine, endLine)`） */
  dirtyOld: { startLine: number; endLine: number };
  /** 新文档侧脏区（0-based 半开） */
  dirtyNew: { startLine: number; endLine: number };
}

/**
 * 旧文档 1-based 行号 → 新文档 1-based 行号。
 *
 * 按 CM changes 顺序累加插入/删除行差；落点在变更区内的行按相对偏移映射。
 *
 * @param changes   CM 行变更集
 * @param oldLine1  旧文档目标行（1-based）
 * @returns 新文档对应行（1-based）
 */
export function mapOldLineToNew(
  changes: CherryChangeLineSet[],
  oldLine1: number,
): number {
  let delta = 0;

  for (const change of changes) {
    if (change.toA < oldLine1) {
      delta += change.insertedLines - change.deletedLines;
    } else if (change.fromA <= oldLine1 && oldLine1 <= change.toA) {
      return change.fromB + (oldLine1 - change.fromA);
    }
  }

  return oldLine1 + delta;
}

/**
 * 从 CM changes 合并旧文档侧原始脏行区间。
 *
 * @param changes CM 行变更集
 * @returns 0-based 半开 `[startLine, endLine)`；无有效变更时 `undefined`
 */
export function dirtyLinesFromChanges(
  changes: CherryChangeLineSet[],
): { startLine: number; endLine: number } | undefined {
  if (!changes.length) return undefined;

  let startLine = Number.POSITIVE_INFINITY;
  let endLine = -1;

  for (const change of changes) {
    const rawStart = change.fromA - 1;
    const rawEnd = change.toA;

    if (rawStart < startLine) startLine = rawStart;
    if (rawEnd > endLine) endLine = rawEnd;
  }

  if (startLine > endLine) return undefined;
  return { startLine, endLine: endLine + 1 };
}

/**
 * 向上/向下寻找安全的块边界。
 *
 * @param spans       全 AST span 列表（旧 AST）
 * @param startLine   初步脏区起始行（0-based）
 * @param endLine     初步脏区结束行（0-based）
 * @returns 扩展后的行区间
 */
export function expandDirtyToBlockBounds(
  spans: AstBlockSpan[],
  startLine: number,
  endLine: number,
): { startLine: number; endLine: number } {
  let expandedStart = startLine;
  let expandedEnd = endLine;

  const affected = findAffectedSpanRange(spans, startLine, endLine);
  if (affected) {
    expandedStart = Math.min(startLine, spans[affected.startIdx]!.startLine);
    expandedEnd = Math.max(endLine, spans[affected.endIdx]!.endLine);
  }

  return { startLine: expandedStart, endLine: expandedEnd };
}

/**
 * 脏区是否与 `globalEffect` 顶层块相交。
 *
 * 定义块（frontmatter、footnote_def、linkReferenceDef 等）写入文档级 store，
 * 编辑后引用块 hash 不变但渲染会变，应降级全量渲染。
 */
export function dirtyTouchesGlobalEffect(
  ast: MarkdownNode,
  changes: CherryChangeLineSet[],
): boolean {
  const rawDirty = dirtyLinesFromChanges(changes);
  if (!rawDirty) return false;

  const spans = astBlockSpans(ast);
  const expanded = expandDirtyToBlockBounds(
    spans,
    rawDirty.startLine,
    rawDirty.endLine,
  );

  for (const span of spans) {
    if (!spanOverlapsDirty(span, expanded.startLine, expanded.endLine)) {
      continue;
    }
    if (span.node.props?.globalEffect === true) return true;
  }
  return false;
}

/**
 * 解析 hash 锚点（prevHash / nextHash）。
 *
 * @param spans    全 AST span 列表（旧 AST）
 * @param expanded 扩展后的脏区
 * @param affected 与脏区有实质相交的 span 索引区间
 */
function resolveAnchors(
  spans: AstBlockSpan[],
  expanded: { startLine: number; endLine: number },
  affected: { startIdx: number; endIdx: number } | null,
): IncrementalParseRange {
  let prevIdx = -1;
  let nextIdx = -1;

  if (affected) {
    prevIdx = affected.startIdx - 1;
    nextIdx = affected.endIdx + 1;
  } else {
    for (let i = 0; i < spans.length; i++) {
      if (spans[i]!.endLine <= expanded.startLine) prevIdx = i;
    }
    for (let i = 0; i < spans.length; i++) {
      if (spans[i]!.startLine >= expanded.endLine) {
        nextIdx = i;
        break;
      }
    }
  }

  return {
    prevHash: prevIdx >= 0 ? spans[prevIdx]!.hash : "",
    nextHash:
      nextIdx >= 0 && nextIdx < spans.length ? spans[nextIdx]!.hash : "",
  };
}

/**
 * 将 hash 锚点行映射到新文档，得到 markdown 切片边界。
 *
 * @param spans         全 AST span 列表（旧 AST）
 * @param prevHash      前锚点 hash
 * @param nextHash      后锚点 hash
 * @param changes       CM 行变更集
 * @param newLineCount  新文档总行数
 */
function sliceBounds(
  spans: AstBlockSpan[],
  prevHash: string,
  nextHash: string,
  changes: CherryChangeLineSet[],
  newLineCount: number,
): { sliceStart: number; sliceEnd: number } {
  const prevIdx = prevHash ? spans.findIndex((s) => s.hash === prevHash) : -1;
  const nextIdx = nextHash ? spans.findIndex((s) => s.hash === nextHash) : -1;

  const sliceStart =
    prevIdx >= 0
      ? mapOldLineToNew(changes, spans[prevIdx]!.endLine + 1) - 1
      : 0;
  const sliceEnd =
    nextIdx >= 0
      ? mapOldLineToNew(changes, spans[nextIdx]!.startLine + 1) - 1
      : newLineCount;

  return { sliceStart, sliceEnd };
}

/**
 * 计算 hash 边界与 markdown 切片（不调用 parse）。
 *
 * @param prevAst   上次渲染的 AST 根
 * @param prevLines 上次归一化源码行
 * @param newLines  编辑后归一化源码行
 * @param changes   CM 行变更集
 * @returns 边界与脏区；无法计算时 `undefined`
 */
function resolveHashBoundaryInternal(
  prevAst: MarkdownNode,
  _prevLines: string[],
  newLines: string[],
  changes: CherryChangeLineSet[],
): HashBoundaryResolveResult | undefined {
  const rawDirty = dirtyLinesFromChanges(changes);
  if (!rawDirty) return undefined;

  const spans = astBlockSpans(prevAst);
  const expandedOld = expandDirtyToBlockBounds(
    spans,
    rawDirty.startLine,
    rawDirty.endLine,
  );

  const dirtyNew = {
    startLine: mapOldLineToNew(changes, expandedOld.startLine + 1) - 1,
    endLine: mapOldLineToNew(changes, expandedOld.endLine + 1) - 1,
  };

  const affected = findAffectedSpanRange(
    spans,
    expandedOld.startLine,
    expandedOld.endLine,
  );
  const { prevHash, nextHash } = resolveAnchors(spans, expandedOld, affected);
  const { sliceStart, sliceEnd } = sliceBounds(
    spans,
    prevHash,
    nextHash,
    changes,
    newLines.length,
  );
  const slice = newLines.slice(sliceStart, sliceEnd);

  return {
    input: {
      range: { prevHash, nextHash },
      markdown: slice.length > 0 ? slice : "",
    },
    dirtyOld: expandedOld,
    dirtyNew,
  };
}

/**
 * 解析 hash 边界并调用 `parseIncremental`，原地更新 `prevAst`。
 *
 * @param prevAst     上次 AST 根（会被 mutate）
 * @param prevLines   上次归一化源码行
 * @param newLines    新归一化源码行
 * @param changes     CM 行变更集
 * @param transformer 解析引擎
 * @returns parse 结果与边界信息；无法 resolve 时 `undefined`
 * @throws `parseIncremental` 锚点 hash 在 AST 中不存在等错误
 */
export function parseWithHashBoundary(
  prevAst: MarkdownNode,
  prevLines: string[],
  newLines: string[],
  changes: CherryChangeLineSet[],
  transformer: TransformerEngine,
):
  | { result: IncrementalParseResult; resolve: HashBoundaryResolveResult }
  | undefined {
  const resolved = resolveHashBoundaryInternal(
    prevAst,
    prevLines,
    newLines,
    changes,
  );
  if (!resolved) return undefined;

  const parseResult = transformer.parseIncremental(
    prevAst,
    resolved.input.markdown,
    resolved.input.range,
  );

  return { result: parseResult, resolve: resolved };
}
