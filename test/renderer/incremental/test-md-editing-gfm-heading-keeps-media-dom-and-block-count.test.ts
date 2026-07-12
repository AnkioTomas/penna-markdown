/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Preview } from "@/editor/preview/Preview";
import type { CherryChangeLineSet } from "@/renderer/incremental/CherryChangeSet.js";
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
): CherryChangeLineSet {
  return {
    fromA,
    toA,
    fromB,
    toB,
    deletedLines: deletedLines ?? toA - fromA,
    insertedLines: insertedLines ?? toB - fromB,
  };
}

it("test.md: editing GFM heading keeps media DOM and block count", () => {
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
  const md = readFileSync(
    resolve(import.meta.dirname, "../../../docs/test.md"),
    "utf8",
  );
  const lines = normalizeMarkdownLines(md);
  const gfmLine1 = lines.findIndex((l) => l === "## GFM 标准语法") + 1;

  const { renderer, mount } = createRenderer();
  renderer.renderFull(md);
  expect(mount.childElementCount).toBe(renderer.getMountedBlocks().length);

  const videoEl = mount.querySelector("video")!;
  const blockCountBefore = renderer.getMountedBlocks().length;

  const nextMd = md.replace(
    "## GFM 标准语法",
    "## GFM 标准语法杀杀杀杀杀杀杀杀杀杀杀杀杀",
  );
  const result = renderer.render(nextMd, [
    lineChange(gfmLine1, gfmLine1, gfmLine1, gfmLine1),
  ]);

  expect(result.partial).toBe(true);
  expect(renderer.getMountedBlocks().length).toBe(blockCountBefore);
  expect(mount.childElementCount).toBe(blockCountBefore);
  expect(mount.querySelector("video")).toBe(videoEl);

  renderer.destroy();

  vi.useRealTimers();
  document.body.innerHTML = "";
});
