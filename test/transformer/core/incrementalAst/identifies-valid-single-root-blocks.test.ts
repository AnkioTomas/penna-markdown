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

it("identifies valid single-root blocks", async () => {
  const engine = () => createEngine();
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  try {
    if (typeof globalThis.document === "undefined") {
      const { JSDOM } = await import("jsdom");
      const dom = new JSDOM();
      globalThis.document = dom.window.document as any;
      globalThis.window = dom.window as any;
    }

    const { BlockIndex } = await import("@/renderer/incremental/BlockIndex.js");
    expect(BlockIndex.isMountedHtml("<p>Hello</p>")).toBe(true);
    expect(BlockIndex.isMountedHtml("  <div><span>Hi</span></div> ")).toBe(
      true,
    );
    expect(BlockIndex.isMountedHtml("plain text")).toBe(false);
    expect(BlockIndex.isMountedHtml("<div>A</div><div>B</div>")).toBe(false);

    const imgHtml =
      '<figure class="cherry-image-card"><img src="https://example.com/a.jpg" alt="" /></figure>';
    expect(BlockIndex.isMountedHtml(imgHtml)).toBe(true);
    const parsed = BlockIndex.parseSingleRootHtml(globalThis.document, imgHtml);
    expect(parsed?.tagName).toBe("FIGURE");
    expect(parsed?.isConnected).toBe(false);
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }
});
