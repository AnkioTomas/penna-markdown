import { expect, it } from "vitest";
import { parseBackslash } from "@/transformer/utils/escape.js";

it("parseBackslash unescapes escapable punctuation", () => {
  expect(parseBackslash("\\*", 0)).toEqual({ value: "*", nextIndex: 2 });
  expect(parseBackslash("\\(", 0)).toEqual({ value: "(", nextIndex: 2 });
});
