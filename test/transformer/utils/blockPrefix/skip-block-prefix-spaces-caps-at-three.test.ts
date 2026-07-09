import { expect, it } from "vitest";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";

it("skipBlockPrefixSpaces caps indentation at three spaces", () => {
  expect(skipBlockPrefixSpaces("   # hi")).toBe(3);
  expect(skipBlockPrefixSpaces("    # hi")).toBe(3);
  expect(skipBlockPrefixSpaces("# hi")).toBe(0);
});
