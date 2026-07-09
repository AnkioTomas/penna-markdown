import { expect, it } from "vitest";
import { containsNestedLink } from "@/transformer/utils/linkLabel.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";

it("containsNestedLink detects link nodes in tree", () => {
  const link = createNode("link", 0);
  expect(containsNestedLink([link])).toBe(true);
  expect(containsNestedLink([createNode("text", 0)])).toBe(false);
});
