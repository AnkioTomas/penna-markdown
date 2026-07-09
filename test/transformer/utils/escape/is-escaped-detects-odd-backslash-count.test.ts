import { expect, it } from "vitest";
import { isEscaped } from "@/transformer/utils/escape.js";

it("isEscaped detects odd backslash count before index", () => {
  expect(isEscaped("\\*", 1)).toBe(true);
  expect(isEscaped("\\\\*", 2)).toBe(false);
  expect(isEscaped("\\\\\\*", 3)).toBe(true);
});
