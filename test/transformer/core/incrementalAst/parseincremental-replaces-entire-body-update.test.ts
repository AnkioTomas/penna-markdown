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

it("parseIncremental replaces entire body (update)", () => {
  const engine = () => createEngine();
  const eng = engine();
  const md = "# A\n\nB\n\nC";
  const prev = eng.parse("# X\n\nY");

  const result = eng.parseIncremental(prev, md, {
    prevHash: "",
    nextHash: "",
  });

  expect(result.type).toBe("update");
  expect(eng.render(prev)).toContain("A");
  expect(eng.render(prev)).toContain("B");
  expect(eng.render(prev)).toContain("C");
});
