import { expect, it } from "vitest";
import {
  buildLineHighlightGradient,
  mergeLineHighlightSpecs,
  parseFenceMeta,
  parseHighlightLinesAttr,
  parseLineHighlightSpec,
} from "@/transformer/extends/block/enhancedCode.js";

it("parses lang token with braces", () => {
  const meta = parseFenceMeta("```js{1,4,6-8}");
  expect(meta?.lang).toBe("js");
  expect(meta?.highlightLines).toEqual([1, 4, 6, 7, 8]);
});
