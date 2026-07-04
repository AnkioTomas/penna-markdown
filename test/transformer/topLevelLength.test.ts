import { describe, expect, it } from "vitest";
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

describe("block line span", () => {
  it("top-level blocks cover all source lines by length sum", () => {
    const md = "# Hello\n\nWorld\n\n```js\n1\n```";
    const { ast, lines } = parseLines(md);
    expect(sumTopLevelLineSpan(ast.children)).toBe(lines.length);
  });

  it("multi-line paragraph gets line count length", () => {
    const md = "line one\nline two\n";
    const { ast, lines } = parseLines(md);
    const para = ast.children?.find((n) => n.type === "paragraph");
    expect(para?.length).toBe(2);
    expect(sumTopLevelLineSpan(ast.children)).toBe(lines.length);
  });

  it("footnotes synthetic node keeps length 0 without breaking coverage", () => {
    const md = "Text[^1]\n\n[^1]: note\n";
    const { ast, lines } = parseLines(md);
    const footnotes = ast.children?.find((n) => n.type === "footnotes");
    expect(footnotes?.length).toBe(0);
    expect(sumTopLevelLineSpan(ast.children)).toBe(lines.length);
  });

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
});
