/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import type { PennaChangeLineSet } from "@/renderer/incremental/PennaChangeSet.js";
import { parseWithHashBoundary } from "@/renderer/incremental/HashBoundaryResolver.js";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";
import { createJsdomRenderer as createRenderer } from "../helpers";

function fullDocLineChange(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number,
): PennaChangeLineSet {
  return {
    fromA,
    toA,
    fromB,
    toB,
    deletedLines: toA - fromA,
    insertedLines: toB - fromB,
    isFullDocument: false,
  };
}

it("parseWithHashBoundary yields empty anchors when dirty region covers all blocks", () => {
  const { renderer } = createRenderer();
  renderer.renderFull("Alpha\n\nBeta\n\nGamma");
  const session = renderer["session"];
  const prevAst = session.ast!;
  const prevLines = session.lines;
  const newLines = normalizeMarkdownLines("Alpha2\n\nBeta2\n\nGamma2");
  const changes = [fullDocLineChange(1, 5, 1, 5)];

  const parsed = parseWithHashBoundary(
    prevAst,
    prevLines,
    newLines,
    changes,
    renderer["transformer"],
  );
  expect(parsed).toBeDefined();
  expect(parsed!.resolve.input.range.prevHash).toBe("");
  expect(parsed!.resolve.input.range.nextHash).toBe("");

  renderer.destroy();
  document.body.innerHTML = "";
});

it("tryUpdate full-replace aborts without updating session snapshot or DOM", () => {
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

  const { renderer, mount, log } = createRenderer();
  renderer.renderFull("Alpha\n\nBeta\n\nGamma");
  const session = renderer["session"];
  const linesBefore = [...session.lines];
  const markdown = "Alpha2\n\nBeta2\n\nGamma2";
  const changes = [fullDocLineChange(1, 5, 1, 5)];

  const update = session.tryUpdate(
    mount,
    markdown,
    renderer["transformer"],
    log,
    changes,
  );

  expect(update.ok).toBe(false);
  expect(update.failReason).toBe("full-replace");
  expect(session.lines).toEqual(linesBefore);
  expect(mount.textContent).toContain("Alpha");
  expect(mount.textContent).not.toContain("Alpha2");

  renderer.destroy();
  vi.useRealTimers();
  document.body.innerHTML = "";
});

it("renderer.render still falls back to full render after full-replace abort", () => {
  const { renderer, mount } = createRenderer();
  renderer.renderFull("Alpha\n\nBeta\n\nGamma");
  const changes = [fullDocLineChange(1, 5, 1, 5)];

  const result = renderer.render("Alpha2\n\nBeta2\n\nGamma2", changes);

  expect(result.partial).toBe(false);
  expect(mount.textContent).toContain("Alpha2");
  expect(mount.textContent).toContain("Beta2");
  expect(mount.textContent).toContain("Gamma2");

  renderer.destroy();
  document.body.innerHTML = "";
});
