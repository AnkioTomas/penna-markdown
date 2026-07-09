import { expect, it } from "vitest";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { getDeepestNode } from "@/transformer/utils/lazyContinuation.js";

it("getDeepestNode stops at paragraph instead of drilling into inline children", () => {
  const paragraph: MarkdownNode = {
    type: "paragraph",
    children: [{ type: "text", value: "hello" }],
  };
  const blockquote: MarkdownNode = {
    type: "blockquote",
    children: [paragraph],
  };

  expect(getDeepestNode([])).toBeNull();
  expect(getDeepestNode([paragraph])).toBe(paragraph);
  expect(getDeepestNode([blockquote])).toBe(paragraph);
});
