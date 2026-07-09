import { expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode";

function parseLines(markdown: string) {
  const engine = new TransformerEngine();
  const ast = engine.parse(markdown);
  const store = ast.props?.store as { lines: string[] } | undefined;
  const lines = store?.lines ?? [];
  return { ast, lines, engine };
}

function sumTopLevelLineSpan(blocks?: MarkdownNode[] | null): number {
  let total = 0;
  for (const block of blocks ?? []) {
    if (block.length > 0) total += block.length;
  }
  return total;
}

it("footnotes synthetic node keeps length 0 without breaking coverage", () => {
  const md = "Text[^1]\n\n[^1]: note\n";
  const { ast, lines } = parseLines(md);
  const footnotes = ast.children?.find((n) => n.type === "footnotes");
  expect(footnotes?.length).toBe(0);
  expect(sumTopLevelLineSpan(ast.children)).toBe(lines.length);
});
