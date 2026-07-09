import { expect, it } from "vitest";
import { isIndentedCodeLine } from "@/transformer/utils/tabs.js";

it("isIndentedCodeLine requires at least four visual columns of indent", () => {
  expect(isIndentedCodeLine("    code")).toBe(true);
  expect(isIndentedCodeLine("\tcode")).toBe(true);
  expect(isIndentedCodeLine("   code")).toBe(false);
});
