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

it("keeps block cache aligned with mount children on demo/test.md", () => {
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
  const md = readFileSync(
    resolve(import.meta.dirname, "../../../docs/test.md"),
    "utf8",
  );
  renderer.renderFull(md);
  expect(mount.childElementCount).toBe(renderer["session"].blocks.length);
  renderer.destroy();

  vi.useRealTimers();
  document.body.innerHTML = "";
});
