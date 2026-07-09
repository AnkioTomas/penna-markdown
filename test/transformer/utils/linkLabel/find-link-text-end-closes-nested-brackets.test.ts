import { expect, it } from "vitest";
import { findLinkTextEnd } from "@/transformer/utils/linkLabel.js";

it("findLinkTextEnd closes nested brackets in link text", () => {
  expect(findLinkTextEnd("[a [b] c]", 1)).toBe(8);
});
