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

it("parseIncremental re-parses frontmatter and resolves [[var]] (update)", () => {
  const engine = () => createEngine();
  const eng = engine();
  const md = "---\ntitle: Hi\n---\n\n# [[title]]";
  const prev = eng.parse(md);
  const heading = findBlock(prev, "atx_heading")!;

  const result = eng.parseIncremental(
    prev,
    "---\ntitle: Hello\n---\n\n# [[title]]",
    { prevHash: "", nextHash: blockId(heading) },
  );

  expect(result.type).toBe("update");
  const fm = prev.children?.find((n) => n.type === "frontmatter");
  expect(fm?.props?.parserStore).toEqual({ frontMatter: { title: "Hello" } });
  expect(eng.render(prev)).toContain("<h1>Hello</h1>");
});
