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

it("does not store startLine on block nodes", () => {
  const md = "# Hello\n\n- one\n  two\n";
  const { ast } = parseLines(md);

  function walk(nodes: MarkdownNode[] | undefined): void {
    for (const node of nodes ?? []) {
      expect(node.props?.startLine).toBeUndefined();
      walk(node.children);
    }
  }

  walk(ast.children);
});
