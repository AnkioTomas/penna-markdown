import { expect, it } from "vitest";
import { isRenderedTopLevelBlock } from "@/transformer/utils/sourceLine.js";

it("isRenderedTopLevelBlock skips blank lines and invisible nodes", () => {
  expect(isRenderedTopLevelBlock({ type: "paragraph" })).toBe(true);
  expect(isRenderedTopLevelBlock({ type: "blank_line" })).toBe(false);
  expect(
    isRenderedTopLevelBlock({ type: "paragraph", props: { invisible: true } }),
  ).toBe(false);
});
