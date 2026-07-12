import { expect, it } from "vitest";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { canGenericLazyContinue } from "@/transformer/utils/lazyContinuation.js";

it("canGenericLazyContinue allows continuation when deepest open block is a paragraph", () => {
  const ctx = {
    canStrongBreak: () => false,
  } as unknown as BlockParseContext;

  const parseFn = (lines: string[]): MarkdownNode[] => [
    {
      type: "paragraph",
      length: 1,
      children: [
        {
          type: "text",
          length: lines.join("\n").length,
          value: lines.join("\n"),
        },
      ],
    },
  ];

  expect(
    canGenericLazyContinue(ctx, ["first line"], "second line", parseFn),
  ).toBe(true);
  expect(canGenericLazyContinue(ctx, [], "second line", parseFn)).toBe(false);
});
