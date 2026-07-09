import { expect, it } from "vitest";
import {
  buildLineHighlightGradient,
  mergeLineHighlightSpecs,
  parseFenceMeta,
  parseHighlightLinesAttr,
  parseLineHighlightSpec,
} from "@/transformer/extends/block/enhancedCode.js";

it("parses single lines", () => {
  expect(parseLineHighlightSpec("4,7,9")).toEqual([4, 7, 9]);
});
