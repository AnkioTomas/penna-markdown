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

it("incrementally updates heading when slug option is enabled", () => {
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
  renderer.render("# Hello\n\nBody");

  const result = renderer.render("# Hello!\n\nBody", [lineChange(1, 1, 1, 1)]);
  expect(result.partial).toBe(true);
  expect(mount.querySelector("h1")!.textContent).toBe("Hello!");
  expect(mount.querySelector("p")!.textContent).toBe("Body");

  renderer.destroy();

  vi.useRealTimers();
  document.body.innerHTML = "";
});
