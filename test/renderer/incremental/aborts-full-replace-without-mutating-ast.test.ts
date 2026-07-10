/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { Theme } from "@/theme/Theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import type { CherryChangeLineSet } from "@/renderer/incremental/CherryChangeSet.js";
import { resolveHashBoundary } from "@/renderer/incremental/HashBoundaryResolver.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";

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

function snapshotAstChildIds(ast: MarkdownNode) {
  return (ast.children ?? []).map((node) => node.props?.id);
}

function fullDocLineChange(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number,
): CherryChangeLineSet {
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

it("resolveHashBoundary yields empty anchors when dirty region covers all blocks", () => {
  const { renderer } = createRenderer();
  renderer.renderFull("Alpha\n\nBeta\n\nGamma");
  const session = renderer["session"];
  const prevAst = session.ast!;
  const prevLines = session.lines;
  const newLines = normalizeMarkdownLines("Alpha2\n\nBeta2\n\nGamma2");
  const changes = [fullDocLineChange(1, 5, 1, 5)];

  const resolved = resolveHashBoundary(prevAst, prevLines, newLines, changes);
  expect(resolved).toBeDefined();
  expect(resolved!.input.range.prevHash).toBe("");
  expect(resolved!.input.range.nextHash).toBe("");

  renderer.destroy();
  document.body.innerHTML = "";
});

it("tryUpdate full-replace aborts before parseIncremental mutates ast", () => {
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

  const { renderer, mount, theme } = createRenderer();
  renderer.renderFull("Alpha\n\nBeta\n\nGamma");
  const session = renderer["session"];
  const astBefore = session.ast!;
  const childIdsBefore = snapshotAstChildIds(astBefore);
  const linesBefore = [...session.lines];
  const markdown = "Alpha2\n\nBeta2\n\nGamma2";
  const changes = [fullDocLineChange(1, 5, 1, 5)];

  const update = session.tryUpdate(
    mount,
    markdown,
    renderer["transformer"],
    theme,
    changes,
  );

  expect(update.ok).toBe(false);
  expect(update.failReason).toBe("full-replace");
  expect(snapshotAstChildIds(session.ast!)).toEqual(childIdsBefore);
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
