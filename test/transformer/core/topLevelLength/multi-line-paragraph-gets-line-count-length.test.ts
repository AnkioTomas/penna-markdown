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

it("multi-line paragraph gets line count length", () => {
  const md = "line one\nline two\n";
  const { ast, lines } = parseLines(md);
  const para = ast.children?.find((n) => n.type === "paragraph");
  expect(para?.length).toBe(2);
  expect(sumTopLevelLineSpan(ast.children)).toBe(lines.length);
});
