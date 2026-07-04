import { describe, expect, it } from "vitest";
import {
  buildLineHighlightGradient,
  mergeLineHighlightSpecs,
  parseFenceMeta,
  parseHighlightLinesAttr,
  parseLineHighlightSpec,
} from "@/transformer/extends/block/enhancedCode.js";

describe("extends/parseLineHighlight", () => {
  it("parses single lines", () => {
    expect(parseLineHighlightSpec("4,7,9")).toEqual([4, 7, 9]);
  });

  it("parses ranges and mixed specs", () => {
    expect(parseLineHighlightSpec("5-8")).toEqual([5, 6, 7, 8]);
    expect(parseLineHighlightSpec("4,7-13,16,23-27,40")).toEqual([
      4, 7, 8, 9, 10, 11, 12, 13, 16, 23, 24, 25, 26, 27, 40,
    ]);
  });

  it("merges and formats highlight line attrs", () => {
    expect(mergeLineHighlightSpecs("1,3", [3, 4])).toEqual([1, 3, 4]);
    expect(parseHighlightLinesAttr("1,4,6,7,8")).toEqual([1, 4, 6, 7, 8]);
  });

  it("parses lang token with braces", () => {
    const meta = parseFenceMeta("```js{1,4,6-8}");
    expect(meta?.lang).toBe("js");
    expect(meta?.highlightLines).toEqual([1, 4, 6, 7, 8]);
  });

  it("parses standalone brace spec after title", () => {
    const meta = parseFenceMeta('```json title="package.json" {2-3}');
    expect(meta?.lang).toBe("json");
    expect(meta?.title).toBe("package.json");
    expect(meta?.highlightLines).toEqual([2, 3]);
  });

  it("builds line highlight gradient css", () => {
    const gradient = buildLineHighlightGradient([1, 4, 6, 7, 8]);
    expect(gradient).toContain("linear-gradient");
    expect(gradient).toContain("var(--cb-line-step)");
    expect(gradient).toContain("var(--cb-body-pad-y");
    expect(gradient).toContain("var(--cb-line-highlight)");
  });
});
