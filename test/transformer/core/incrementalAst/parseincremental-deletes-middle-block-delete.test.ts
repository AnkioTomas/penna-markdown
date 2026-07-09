import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../helpers/engine.js";
import { type MarkdownNode } from "@/transformer/core/MarkdownNode.js";

/** 取块的内容 hash（props.id）。 */
function blockId(node: MarkdownNode): string {
  return node.props?.id as string;
}

/** 按 type 找第一个顶层块。 */
function findBlock(ast: MarkdownNode, type: string): MarkdownNode | undefined {
  return ast.children?.find((n) => n.type === type);
}

/** 按 type 找全部顶层块。 */
function findBlocks(ast: MarkdownNode, type: string): MarkdownNode[] {
  return (ast.children ?? []).filter((n) => n.type === type);
}

it("parseIncremental deletes middle block (delete)", () => {
  const engine = () => createEngine();
  const eng = engine();
  const prev = eng.parse("# A\n\nB\n\nC");
  const heading = findBlock(prev, "atx_heading")!;
  const tail = findBlocks(prev, "paragraph").at(-1)!;

  const result = eng.parseIncremental(prev, "", {
    prevHash: blockId(heading),
    nextHash: blockId(tail),
  });

  expect(result.type).toBe("delete");
  expect(result.nodes.some((n) => n.type === "paragraph")).toBe(true);
  expect(eng.render(prev)).toContain("A");
  expect(eng.render(prev)).toContain("C");
  expect(eng.render(prev)).not.toMatch(/>\s*B\s*</);
});
