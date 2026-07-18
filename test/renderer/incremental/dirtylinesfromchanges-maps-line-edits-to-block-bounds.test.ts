/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Preview } from "@/editor/preview/Preview";
import type { PennaChangeLineSet } from "@/renderer/incremental/PennaChangeSet.js";
import { createJsdomRenderer as createRenderer } from "../helpers";
import {
  dirtyLinesFromChanges,
  mapOldLineToNew,
  astBlockSpans,
  findAffectedSpanRange,
} from "@/renderer/incremental/HashBoundaryResolver.js";
import { BlockIndex } from "@/renderer/incremental/BlockIndex.js";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";

function lineChange(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number,
  deletedLines?: number,
  insertedLines?: number,
): PennaChangeLineSet {
  return {
    fromA,
    toA,
    fromB,
    toB,
    deletedLines: deletedLines ?? toA - fromA,
    insertedLines: insertedLines ?? toB - fromB,
  };
}

it("dirtyLinesFromChanges maps line edits to block bounds", () => {
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
    key: () => null,
    length: 0,
  });
  const transformer = new TransformerEngine({
    renderOptions: { sourceLineMap: true },
  });
  const md = "# Title\n\nHello\n\nFooter\n";
  const ast = transformer.parse(md);
  const spans = astBlockSpans(ast);
  const changes = [lineChange(3, 3, 3, 3)];

  const raw = dirtyLinesFromChanges(changes)!;
  const affected = findAffectedSpanRange(spans, raw.startLine, raw.endLine)!;
  const block = spans[affected.startIdx]!;

  // 闭区间邻接会先咬到段落前的 blank_line（[1,2)），再覆盖目标段落。
  expect(block.startLine).toBe(1);
  expect(block.endLine).toBe(2);
  expect(
    spans
      .slice(affected.startIdx, affected.endIdx + 1)
      .some((s) => s.startLine === 2 && s.endLine === 3),
  ).toBe(true);
  expect(mapOldLineToNew(changes, 3)).toBe(3);

  vi.useRealTimers();
  document.body.innerHTML = "";
});
