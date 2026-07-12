import { expect, it } from "vitest";
import { isRenderedTopLevelBlock } from "@/transformer/utils/sourceLine.js";

it("isRenderedTopLevelBlock skips blank lines and invisible nodes", () => {
  expect(isRenderedTopLevelBlock({ type: "paragraph", length: 1 })).toBe(true);
  expect(isRenderedTopLevelBlock({ type: "blank_line", length: 1 })).toBe(
    false,
  );
  expect(
    isRenderedTopLevelBlock({
      type: "paragraph",
      length: 1,
      props: { invisible: true },
    }),
  ).toBe(false);
});
