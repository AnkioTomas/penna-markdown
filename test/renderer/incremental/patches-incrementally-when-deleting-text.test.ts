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

it("patches incrementally when deleting text", () => {
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
  renderer.render("Intro\n\n# Title\n\nPad\n\nHello world\n\nFooter");

  const h1 = mount.querySelector("h1")!;
  const h1Html = h1.outerHTML;

  const result = renderer.render("Intro\n\n# Title\n\nPad\n\nHello\n\nFooter", [
    lineChange(7, 7, 7, 7),
  ]);
  expect(result.partial).toBe(true);
  expect(mount.querySelector("h1")!.outerHTML).toBe(h1Html);
  expect(mount.querySelector("p:nth-of-type(3)")!.textContent).toBe("Hello");

  renderer.destroy();

  vi.useRealTimers();
  document.body.innerHTML = "";
});
