import { expect, it } from "vitest";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { getDeepestNode } from "@/transformer/utils/lazyContinuation.js";

it("getDeepestNode stops at paragraph instead of drilling into inline children", () => {
  const paragraph: MarkdownNode = {
    type: "paragraph",
    length: 1,
    children: [{ type: "text", length: 5, value: "hello" }],
  };
  const blockquote: MarkdownNode = {
    type: "blockquote",
    length: 1,
    children: [paragraph],
  };

  expect(getDeepestNode([])).toBeNull();
  expect(getDeepestNode([paragraph])).toBe(paragraph);
  expect(getDeepestNode([blockquote])).toBe(paragraph);
});
