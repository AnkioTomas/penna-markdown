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

it("does not fall back to full render when footnotes exist but edited range is unrelated", () => {
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
  const { renderer, mount } = createRenderer();
  // 两侧加锚点块，避免闭区间邻接把整篇吞进脏区后降级全量。
  renderer.renderFull("Keep\n\nBefore\n\nMid\n\n[^a]: note\n\nAfter\n\nTail");

  const result = renderer.render(
    "Keep\n\nBefore edited\n\nMid\n\n[^a]: note\n\nAfter\n\nTail",
    [lineChange(3, 3, 3, 3)],
  );
  expect(result.partial).toBe(true); // 优化后，无关区域的修改不再退化为全量渲染！
  expect(mount.textContent).toContain("Before edited");
  renderer.destroy();

  vi.useRealTimers();
  document.body.innerHTML = "";
});
