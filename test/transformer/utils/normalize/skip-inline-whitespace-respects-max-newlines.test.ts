import { expect, it } from "vitest";
import { skipInlineWhitespace } from "@/transformer/utils/normalize.js";

it("skipInlineWhitespace respects maxNewlines when allowNewline is true", () => {
  const src = " \n\nrest";
  expect(
    skipInlineWhitespace(src, 0, { allowNewline: true, maxNewlines: 1 }),
  ).toBe(2);
  expect(skipInlineWhitespace(src, 0, { allowNewline: false })).toBe(1);
});
