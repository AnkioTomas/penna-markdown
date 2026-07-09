/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { Theme } from "@/theme/Theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import { Preview } from "@/editor/preview/Preview";
import type { CherryChangeLineSet } from "@/renderer/incremental/CherryChangeSet.js";
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

function createRenderer(debug = false) {
  const dom = new JSDOM(`<div id="preview" class="cherry"></div>`, {
    url: "http://localhost/",
  });
  const mount = dom.window.document.getElementById("preview") as HTMLElement;
  const theme = new Theme(debug);
  theme.setTheme("default", mount);
  const renderer = new Renderer({ mount, theme });
  return { renderer, mount, theme, dom };
}

it("syncs DOM when deleting a middle block", () => {
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
  renderer.render("A\n\nB\n\nC\n\nD");

  const result = renderer.render("A\n\nC\n\nD", [lineChange(3, 4, 3, 2)]);
  expect(result.partial).toBe(true);
  expect(mount.children.length).toBe(3);
  expect([...mount.children].map((el) => el.textContent?.trim())).toEqual([
    "A",
    "C",
    "D",
  ]);

  renderer.destroy();

  vi.useRealTimers();
  document.body.innerHTML = "";
});
