import { expect, it } from "vitest";
import { isAngleDestinationBrokenByNewline } from "@/transformer/utils/linkDestination.js";

it("isAngleDestinationBrokenByNewline detects newline inside angle destination", () => {
  expect(isAngleDestinationBrokenByNewline("<foo\nbar>", 0)).toBe(true);
  expect(isAngleDestinationBrokenByNewline("<foo>", 0)).toBe(false);
});
