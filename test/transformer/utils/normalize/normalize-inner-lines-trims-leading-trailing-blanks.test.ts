import { expect, it } from "vitest";
import { normalizeInnerLines } from "@/transformer/utils/normalize.js";

it("normalizeInnerLines trims leading and trailing blank lines", () => {
  expect(normalizeInnerLines(["", "a", "", "b", ""])).toEqual(["a", "", "b"]);
});
