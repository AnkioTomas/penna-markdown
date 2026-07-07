import { describe, expect, it } from "vitest";
import { type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { createEngine } from "../helpers/engine.js";

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

describe("transformer/IncrementalParser", () => {
  const engine = () => createEngine();

  it("parseIncremental updates middle paragraph (update)", () => {
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

  it("parseIncremental re-parses frontmatter and resolves [[var]] (update)", () => {
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

  it("parseIncremental replaces entire body (update)", () => {
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

  it("parseIncremental appends at document end (create)", () => {
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

  it("parseIncremental deletes middle block (delete)", () => {
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

  describe("isMountedHtml", () => {
    it("identifies valid single-root blocks", async () => {
      const originalDocument = globalThis.document;
      const originalWindow = globalThis.window;

      try {
        if (typeof globalThis.document === "undefined") {
          const { JSDOM } = await import("jsdom");
          const dom = new JSDOM();
          globalThis.document = dom.window.document as any;
          globalThis.window = dom.window as any;
        }

        const { BlockIndex } =
          await import("@/renderer/incremental/BlockIndex.js");
        expect(BlockIndex.isMountedHtml("<p>Hello</p>")).toBe(true);
        expect(BlockIndex.isMountedHtml("  <div><span>Hi</span></div> ")).toBe(
          true,
        );
        expect(BlockIndex.isMountedHtml("plain text")).toBe(false);
        expect(BlockIndex.isMountedHtml("<div>A</div><div>B</div>")).toBe(
          false,
        );

        const imgHtml =
          '<figure class="cherry-image-card"><img src="https://example.com/a.jpg" alt="" /></figure>';
        expect(BlockIndex.isMountedHtml(imgHtml)).toBe(true);
        const parsed = BlockIndex.parseSingleRootHtml(
          globalThis.document,
          imgHtml,
        );
        expect(parsed?.tagName).toBe("FIGURE");
        expect(parsed?.isConnected).toBe(false);
      } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
      }
    });
  });
});
