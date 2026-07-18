import { expect, it } from "vitest";
import { createEngine } from "../../helpers/engine.js";
import {
  astBlockSpans,
  dirtyTouchesGlobalEffect,
  dirtyLinesFromChanges,
} from "@/renderer/incremental/HashBoundaryResolver.js";
import type { PennaChangeLineSet } from "@/renderer/incremental/PennaChangeSet.js";

function lineChange(
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
  };
}

it("dirtyTouchesGlobalEffect is true when frontmatter line is edited", () => {
  const ast = createEngine().parse("---\ntitle: Hi\n---\n\nBody");
  const changes = [lineChange(2, 2, 2, 2)];
  expect(dirtyTouchesGlobalEffect(ast, changes)).toBe(true);
});

it("dirtyTouchesGlobalEffect is true when body is adjacent to frontmatter", () => {
  // 闭区间邻接：Body 与 frontmatter 仅隔一行 blank 时，脏区会咬到 globalEffect。
  const ast = createEngine().parse("---\ntitle: Hi\n---\n\nBody");
  const changes = [lineChange(5, 5, 5, 5)];
  expect(dirtyTouchesGlobalEffect(ast, changes)).toBe(true);
});

it("dirtyTouchesGlobalEffect is false when body is far from frontmatter", () => {
  const ast = createEngine().parse(
    "---\ntitle: Hi\n---\n\nPad1\n\nPad2\n\nBody",
  );
  const changes = [lineChange(9, 9, 9, 9)];
  expect(dirtyTouchesGlobalEffect(ast, changes)).toBe(false);
});

it("dirtyTouchesGlobalEffect is true when footnote definition is edited", () => {
  const ast = createEngine().parse("Text [^1]\n\n[^1]: note");
  const spans = astBlockSpans(ast);
  const fnSpan = spans.find((s) => s.node.type === "footnote_def");
  expect(fnSpan?.node.props?.globalEffect).toBe(true);

  const defLine1 = fnSpan!.startLine + 1;
  const changes = [lineChange(defLine1, defLine1, defLine1, defLine1)];
  expect(dirtyTouchesGlobalEffect(ast, changes)).toBe(true);
});

it("dirtyTouchesGlobalEffect is true when link reference definition is edited", () => {
  const ast = createEngine().parse("[text][ref]\n\n[ref]: https://example.com");
  const spans = astBlockSpans(ast);
  const lrdSpan = spans.find((s) => s.node.type === "linkReferenceDef");
  expect(lrdSpan?.node.props?.globalEffect).toBe(true);

  const defLine1 = lrdSpan!.startLine + 1;
  const changes = [lineChange(defLine1, defLine1, defLine1, defLine1)];
  expect(dirtyTouchesGlobalEffect(ast, changes)).toBe(true);
});

it("dirtyLinesFromChanges returns undefined for empty changes", () => {
  expect(dirtyLinesFromChanges([])).toBeUndefined();
  expect(dirtyTouchesGlobalEffect(createEngine().parse("Hi"), [])).toBe(false);
});
