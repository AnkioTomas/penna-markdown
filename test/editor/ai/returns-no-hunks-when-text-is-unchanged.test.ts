import { expect, it } from "vitest";
import { buildHunks, diffLines } from "@/editor/ai/diffLines";

it("returns no hunks when text is unchanged", () => {
  const text = "same line\n";
  expect(buildHunks(text, text, 0)).toEqual([]);
});
