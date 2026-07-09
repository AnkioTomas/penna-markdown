import { expect, it } from "vitest";
import {
  buildLineHighlightGradient,
  mergeLineHighlightSpecs,
  parseFenceMeta,
  parseHighlightLinesAttr,
  parseLineHighlightSpec,
} from "@/transformer/extends/block/enhancedCode.js";

it("parses ranges and mixed specs", () => {
  expect(parseLineHighlightSpec("5-8")).toEqual([5, 6, 7, 8]);
  expect(parseLineHighlightSpec("4,7-13,16,23-27,40")).toEqual([
    4, 7, 8, 9, 10, 11, 12, 13, 16, 23, 24, 25, 26, 27, 40,
  ]);
});
