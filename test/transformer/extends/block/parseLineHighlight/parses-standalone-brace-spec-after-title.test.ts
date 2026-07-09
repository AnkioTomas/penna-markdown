import { expect, it } from "vitest";
import {
  buildLineHighlightGradient,
  mergeLineHighlightSpecs,
  parseFenceMeta,
  parseHighlightLinesAttr,
  parseLineHighlightSpec,
} from "@/transformer/extends/block/enhancedCode.js";

it("parses standalone brace spec after title", () => {
  const meta = parseFenceMeta('```json title="package.json" {2-3}');
  expect(meta?.lang).toBe("json");
  expect(meta?.title).toBe("package.json");
  expect(meta?.highlightLines).toEqual([2, 3]);
});
