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

it("parseIncremental appends at document end (create)", () => {
  const engine = () => createEngine();
  const eng = engine();
  const prev = eng.parse("# A\n\nB");
  const last = findBlocks(prev, "paragraph").at(-1)!;

  const result = eng.parseIncremental(prev, "C", {
    prevHash: blockId(last),
    nextHash: "",
  });

  expect(result.type).toBe("create");
  expect(eng.render(prev)).toContain("C");
});
