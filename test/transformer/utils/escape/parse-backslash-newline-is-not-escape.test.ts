import { expect, it } from "vitest";
import { parseBackslash } from "@/transformer/utils/escape.js";

it("parseBackslash returns null for backslash-newline", () => {
  expect(parseBackslash("\\\n", 0)).toBeNull();
});
