import { expect, it } from "vitest";
import { unescapeHref } from "@/transformer/utils/linkDestination.js";

it("unescapeHref removes backslash before ASCII punctuation", () => {
  expect(unescapeHref(String.raw`foo\(\)`)).toBe("foo()");
  expect(unescapeHref(String.raw`a\%b`)).toBe("a%b");
});
