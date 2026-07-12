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

it("preserves unchanged block DOM when inserting lines at top", () => {
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
  renderer.render("# Title\n\nHello\n\nFooter");

  const h1 = mount.querySelector("h1")!;
  const footer = [...mount.querySelectorAll("p")].find(
    (el) => el.textContent?.trim() === "Footer",
  )!;

  const result = renderer.render("prefix\n\n# Title\n\nHello\n\nFooter", [
    lineChange(1, 0, 1, 2),
  ]);
  expect(result.partial).toBe(true);
  expect(mount.querySelector("h1")).toBe(h1);
  expect(
    [...mount.querySelectorAll("p")].find(
      (el) => el.textContent?.trim() === "Footer",
    ),
  ).toBe(footer);

  renderer.destroy();

  vi.useRealTimers();
  document.body.innerHTML = "";
});
