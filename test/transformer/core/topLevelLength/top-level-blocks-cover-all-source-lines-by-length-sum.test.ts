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

it("top-level blocks cover all source lines by length sum", () => {
  const md = "# Hello\n\nWorld\n\n```js\n1\n```";
  const { ast, lines } = parseLines(md);
  expect(sumTopLevelLineSpan(ast.children)).toBe(lines.length);
});
