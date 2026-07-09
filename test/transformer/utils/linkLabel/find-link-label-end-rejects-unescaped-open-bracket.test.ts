import { expect, it } from "vitest";
import { findLinkLabelEnd } from "@/transformer/utils/linkLabel.js";

it("findLinkLabelEnd rejects unescaped open bracket inside label", () => {
  expect(findLinkLabelEnd("[a[b", 1)).toBe(-1);
  expect(findLinkLabelEnd("[ok]", 1)).toBe(3);
});
