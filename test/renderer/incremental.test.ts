/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";
import { Theme } from "@/theme/Theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import { Preview } from "@/editor/preview/Preview";
import { BLOCK_DOM_ID_ATTR } from "@/renderer/incremental/BlockCacheEntry.js";
import type { CherryChangeLineSet } from "@/renderer/incremental/CherryChangeSet.js";
import {
  dirtyRangeFromLineChanges,
  expandToBlockStart,
} from "@/renderer/incremental/dirtyRange.js";
import { buildBlockEntries } from "@/renderer/incremental/renderCache.js";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";

function lineChange(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number,
): CherryChangeLineSet {
  return { fromA, toA, fromB, toB };
}

function createRenderer(debug = false) {
  const dom = new JSDOM(`<div id="preview" class="cherry"></div>`, {
    url: "http://localhost/",
  });
  const mount = dom.window.document.getElementById("preview") as HTMLElement;
  const theme = new Theme(debug);
  theme.setTheme("default", mount);
  const renderer = new Renderer({ mount, theme });
  return { renderer, mount, theme, dom };
}

describe("renderer/incremental", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) delete store[key];
      },
      key: () => null,
      length: 0,
    });
  });
  it("dirtyRangeFromLineChanges maps line edits to 0-based range", () => {
    const dirty = dirtyRangeFromLineChanges(
      [lineChange(3, 3, 3, 3)],
      "new",
    );
    expect(dirty).toEqual({ startLine: 2, endLine: 3 });
  });

  it("skips renderBlock outside dirty range", () => {
    const transformer = new TransformerEngine({
      renderOptions: { sourceLineMap: true },
    });
    const prevMd = "# Title\n\nHello\n\nFooter\n";
    const nextMd = "# Title\n\nHello world\n\nFooter\n";
    const prevLines = normalizeMarkdownLines(prevMd);
    const nextLines = normalizeMarkdownLines(nextMd);
    const prevAst = transformer.parse(prevMd);
    const nextAst = transformer.parseIncremental(prevAst, nextMd, {
      parseStartOld: 2,
      parseEndOld: 3,
      parseStartNew: 2,
      parseEndNew: 3,
    });
    const prevBlocks = buildBlockEntries(prevLines, prevAst, [], transformer).blocks;

    const dirty = expandToBlockStart(
      dirtyRangeFromLineChanges([lineChange(3, 3, 3, 3)], "new")!,
      prevBlocks,
    );

    const spy = vi.spyOn(transformer, "renderBlock");
    buildBlockEntries(nextLines, nextAst, prevBlocks, transformer, undefined, dirty);
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    spy.mockRestore();
  });

  it("skips html comment blocks that produce no element root", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("Before\n\n<!-- comment only -->\n\nAfter");
    expect(mount.childElementCount).toBe(renderer["documentModel"].blocks.length);
    expect(mount.childElementCount).toBe(2);

    const result = renderer.render(
      "Before\n\n<!-- comment only -->\n\nAfter edited",
      [lineChange(5, 5, 5, 5)],
    );
    expect(result.partial).toBe(true);
    renderer.destroy();
  });

  it("keeps block cache aligned with mount children on demo/test.md", () => {
    const { renderer, mount } = createRenderer();
    const md = readFileSync("demo/test.md", "utf8");
    renderer.renderFull(md);
    expect(mount.childElementCount).toBe(renderer["documentModel"].blocks.length);
    renderer.destroy();
  });

  it("incremental update works when cache matches dom count", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("# Title\n\nHello\n\nFooter");
    expect(mount.childElementCount).toBe(renderer["documentModel"].blocks.length);

    const result = renderer.render(
      "# Title\n\nHello world\n\nFooter",
      [lineChange(3, 3, 3, 3)],
    );
    expect(result.partial).toBe(true);
    expect(mount.querySelector("p")!.textContent).toContain("Hello world");
    renderer.destroy();
  });

  it("ignores empty-html cache entries so dom and blocks stay aligned", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("A\n\nB");
    const model = renderer["documentModel"];
    model.blocks = [
      ...model.blocks.slice(0, 1),
      { ...model.blocks[0]!, html: "   ", domId: "ghost" },
      ...model.blocks.slice(1),
    ];
    expect(model.blocks.length).toBeGreaterThan(mount.childElementCount);

    const result = renderer.render(
      "A\n\nB edited",
      [lineChange(3, 3, 3, 3)],
    );
    expect(result.partial).toBe(true);
    expect(mount.childElementCount).toBe(model.blocks.length);
    renderer.destroy();
  });

  it("patches only changed paragraph when appending text", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello");

    const h1 = mount.querySelector("h1")!;
    const h1Html = h1.outerHTML;

    const result = renderer.render("# Title\n\nHello world");
    expect(result.partial).toBe(true);
    expect(mount.querySelector("h1")!.outerHTML).toBe(h1Html);
    expect(mount.querySelector("p")!.textContent).toContain("Hello world");

    renderer.destroy();
  });

  it("patches incrementally when deleting text", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello world");

    const h1 = mount.querySelector("h1")!;
    const h1Html = h1.outerHTML;

    const result = renderer.render("# Title\n\nHello");
    expect(result.partial).toBe(true);
    expect(mount.querySelector("h1")!.outerHTML).toBe(h1Html);
    expect(mount.querySelector("p")!.textContent).toBe("Hello");

    renderer.destroy();
  });

  it("syncs DOM when deleting a middle block", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("A\n\nB\n\nC\n\nD");

    const result = renderer.render("A\n\nC\n\nD");
    expect(result.partial).toBe(true);
    expect(mount.children.length).toBe(3);
    expect([...mount.children].map((el) => el.textContent?.trim())).toEqual([
      "A",
      "C",
      "D",
    ]);

    renderer.destroy();
  });

  it("falls back to full render when heading slug must regenerate", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Hello\n\nBody");

    const result = renderer.render("# Hello!\n\nBody");
    expect(result.partial).toBe(false);
    expect(mount.querySelector("h1")!.textContent).toBe("Hello!");
    expect(mount.querySelector("p")!.textContent).toBe("Body");

    renderer.destroy();
  });

  it("syncs after line numbers shift without missing-dom", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("line0\n\nline1\n\nline2");

    const result = renderer.render("prefix\n\nline0\n\nline1\n\nline2");
    expect(result.partial).toBe(true);
    expect(mount.children.length).toBe(4);

    renderer.destroy();
  });

  it("keeps domId on reused paragraph after incremental patch", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello");
    const p = mount.querySelector("p")!;
    const domId = p.getAttribute(BLOCK_DOM_ID_ATTR);
    expect(domId).toBeTruthy();

    renderer.render("# Title\n\nHello world");

    expect(mount.querySelector("p")!.getAttribute(BLOCK_DOM_ID_ATTR)).not.toBe(domId);
    expect(mount.querySelector("p")!.textContent).toContain("Hello world");

    renderer.destroy();
  });

  it("does not call renderBlock for unchanged blocks", () => {
    const { mount, theme } = createRenderer();
    const transformer = new TransformerEngine({
      renderOptions: { sourceLineMap: true },
    });
    const markdown = "# Title\n\nHello";
    const lines = normalizeMarkdownLines(markdown);
    const ast = transformer.parse(markdown);
    const first = buildBlockEntries(lines, ast, [], transformer);

    const spy = vi.spyOn(transformer, "renderBlock");
    buildBlockEntries(lines, ast, first.blocks, transformer, undefined, {
      startLine: 99,
      endLine: 99,
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    theme.setTheme("default", mount);
  });

  it("preserves DOM node refs when domId is unchanged", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello");

    const h1 = mount.querySelector("h1");
    const p = mount.querySelector("p");

    const result = renderer.render("# Title\n\nHello");
    expect(result.partial).toBe(true);
    expect(mount.querySelector("h1")).toBe(h1);
    expect(mount.querySelector("p")).toBe(p);

    renderer.destroy();
  });

  it("reorders blocks via line-based dom sync", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("A\n\nB\n\nC");

    const result = renderer.render("C\n\nB\n\nA");
    expect(result.partial).toBe(true);
    expect([...mount.children].map((el) => el.textContent?.trim())).toEqual([
      "C",
      "B",
      "A",
    ]);

    renderer.destroy();
  });

  it("falls back to full render when dom cache mismatches", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Hello\n\nBody");
    mount.appendChild(mount.ownerDocument.createElement("div"));

    const result = renderer.render("# Hello\n\nBody\n\nTail");
    expect(result.partial).toBe(false);
    expect(mount.querySelector("p")!.textContent).toBe("Body");

    renderer.destroy();
  });

  it("keeps unchanged heading DOM when only paragraph changes", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello");

    const h1 = mount.querySelector("h1")!;
    renderer.render("# Title\n\nHello world");
    expect(mount.querySelector("h1")).toBe(h1);

    renderer.destroy();
  });

  it("does not fall back to full render when footnotes exist but edited range is unrelated", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("Before\n\n[^a]: note\n\nAfter");

    const result = renderer.render(
      "Before edited\n\n[^a]: note\n\nAfter",
      [lineChange(1, 1, 1, 1)],
    );
    expect(result.partial).toBe(true); // 优化后，无关区域的修改不再退化为全量渲染！
    expect(mount.textContent).toContain("Before edited");
    renderer.destroy();
  });

  it("falls back to full render when footnotes themselves are modified", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("Before\n\n[^a]: note\n\nAfter");

    const result = renderer.render(
      "Before\n\n[^a]: note edited\n\nAfter",
      [lineChange(3, 3, 3, 3)],
    );
    expect(result.partial).toBe(false); // 脚注被修改，必须触发全量渲染
    renderer.destroy();
  });

  it("incremental update when frontmatter title changes", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("---\ntitle: Hi\n---\n\n# [[title]]");
    expect(mount.querySelector("h1")!.textContent).toBe("Hi");

    const result = renderer.render(
      "---\ntitle: Hello\n---\n\n# [[title]]",
      [lineChange(2, 2, 2, 2)],
    );
    expect(result.partial).toBe(true);
    expect(mount.querySelector("h1")!.textContent).toBe("Hello");
    renderer.destroy();
  });
});

describe("Preview debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="preview"></div>';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("debounces editor:change before rendering", async () => {
    const mount = document.getElementById("preview") as HTMLElement;
    const theme = new Theme();
    theme.setTheme("default", mount);

    const renderSpy = vi.fn();
    const preview = new Preview(mount, theme, { debounceMs: 100 });

    theme.on("preview:rendered", renderSpy);
    theme.emit("editor:change", { markdown: "a" });
    renderSpy.mockClear();

    theme.emit("editor:change", { markdown: "ab" });
    theme.emit("editor:change", { markdown: "abc" });
    expect(renderSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    preview.destroy();
  });
});
