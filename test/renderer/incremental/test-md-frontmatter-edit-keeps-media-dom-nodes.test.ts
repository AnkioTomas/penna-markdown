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

it("test.md: frontmatter edit keeps media DOM nodes", () => {
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
  const { renderer, mount } = createRenderer();
  renderer.renderFull(md);

  expect(mount.querySelector("video")).toBeTruthy();
  expect(mount.querySelector("audio")).toBeTruthy();

  const nextMd = md.replace("title: Penna Markdown", "title: Penna Markdown X");
  const result = renderer.render(nextMd, [lineChange(2, 2, 2, 2)]);
  expect(result.partial).toBe(false);
  expect(mount.querySelector("h1")!.textContent).toContain("Penna Markdown X");
  expect(mount.querySelector("video")).toBeTruthy();
  expect(mount.querySelector("audio")).toBeTruthy();

  renderer.destroy();

  vi.useRealTimers();
  document.body.innerHTML = "";
});
