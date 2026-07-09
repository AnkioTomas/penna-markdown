import { expect, it } from "vitest";
import {
  buildLineHighlightGradient,
  mergeLineHighlightSpecs,
  parseFenceMeta,
  parseHighlightLinesAttr,
  parseLineHighlightSpec,
} from "@/transformer/extends/block/enhancedCode.js";

it("builds line highlight gradient css", () => {
  const gradient = buildLineHighlightGradient([1, 4, 6, 7, 8]);
  expect(gradient).toContain("linear-gradient");
  expect(gradient).toContain("var(--cb-line-step)");
  expect(gradient).toContain("var(--cb-body-pad-y");
  expect(gradient).toContain("var(--cb-line-highlight)");
});
