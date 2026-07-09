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

it("parseIncremental updates middle paragraph (update)", () => {
  const engine = () => createEngine();
  const eng = engine();
  const prev = eng.parse("# Title\n\nHello\n\nFooter");
  const title = findBlock(prev, "atx_heading")!;
  const footer = findBlocks(prev, "paragraph").at(-1)!;

  const result = eng.parseIncremental(prev, "Hello world", {
    prevHash: blockId(title),
    nextHash: blockId(footer),
  });

  expect(result.type).toBe("update");
  expect(result.nodes.length).toBeGreaterThan(0);

  const html = eng.render(prev);
  expect(html).toContain("Hello world");
  expect(html).toContain("Footer");
});
