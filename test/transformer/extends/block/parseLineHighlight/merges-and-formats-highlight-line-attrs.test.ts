import { expect, it } from "vitest";
import {
  buildLineHighlightGradient,
  mergeLineHighlightSpecs,
  parseFenceMeta,
  parseHighlightLinesAttr,
  parseLineHighlightSpec,
} from "@/transformer/extends/block/enhancedCode.js";

it("merges and formats highlight line attrs", () => {
  expect(mergeLineHighlightSpecs("1,3", [3, 4])).toEqual([1, 3, 4]);
  expect(parseHighlightLinesAttr("1,4,6,7,8")).toEqual([1, 4, 6, 7, 8]);
});
