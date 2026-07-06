/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";
import { Theme } from "@/theme/Theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import { Preview } from "@/editor/preview/Preview";
import type { CherryChangeLineSet } from "@/renderer/incremental/CherryChangeSet.js";
import { dirtyLinesFromChanges, mapOldLineToNew, astBlockSpans, findAffectedSpanRange } from "@/renderer/incremental/HashBoundaryResolver.js";
import { BlockIndex } from "@/renderer/incremental/BlockIndex.js";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";

function lineChange(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number,
  deletedLines?: number,
  insertedLines?: number,
): CherryChangeLineSet {
  return {
    fromA,
    toA,
    fromB,
    toB,
    deletedLines: deletedLines ?? (toA - fromA),
    insertedLines: insertedLines ?? (toB - fromB),
  };
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
  it("dirtyLinesFromChanges maps line edits to block bounds", () => {
    const transformer = new TransformerEngine({
      renderOptions: { sourceLineMap: true },
    });
    const md = "# Title\n\nHello\n\nFooter\n";
    const ast = transformer.parse(md);
    const spans = astBlockSpans(ast);
    const changes = [lineChange(3, 3, 3, 3)];

    const raw = dirtyLinesFromChanges(changes)!;
    const affected = findAffectedSpanRange(spans, raw.startLine, raw.endLine)!;
    const block = spans[affected.startIdx]!;

    expect(block.startLine).toBe(2);
    expect(block.endLine).toBe(3);
    expect(mapOldLineToNew(changes, 3)).toBe(3);
  });

  it("preserves unchanged block DOM when inserting lines at top", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello\n\nFooter");

    const h1 = mount.querySelector("h1")!;
    const footer = [...mount.querySelectorAll("p")].find(
      (el) => el.textContent?.trim() === "Footer",
    )!;

    const result = renderer.render(
      "prefix\n\n# Title\n\nHello\n\nFooter",
      [lineChange(1, 0, 1, 2)],
    );
    expect(result.partial).toBe(true);
    expect(mount.querySelector("h1")).toBe(h1);
    expect(
      [...mount.querySelectorAll("p")].find(
        (el) => el.textContent?.trim() === "Footer",
      ),
    ).toBe(footer);

    renderer.destroy();
  });

  it("does not call renderBlock for unchanged blocks on noop edit", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello");

    const spy = vi.spyOn(renderer["transformer"], "renderBlock");
    renderer.render("# Title\n\nHello", [lineChange(3, 3, 3, 3)]);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();

    renderer.destroy();
  });

  it("skips html comment blocks that produce no element root", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("Before\n\n<!-- comment only -->\n\nAfter");
    expect(mount.childElementCount).toBe(renderer["session"].blocks.length);
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
    expect(mount.childElementCount).toBe(renderer["session"].blocks.length);
    renderer.destroy();
  });

  it("incremental update works when cache matches dom count", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("# Title\n\nHello\n\nFooter");
    expect(mount.childElementCount).toBe(renderer["session"].blocks.length);

    const result = renderer.render(
      "# Title\n\nHello world\n\nFooter",
      [lineChange(3, 3, 3, 3)],
    );
    expect(result.partial).toBe(true);
    expect(mount.querySelector("p")!.textContent).toContain("Hello world");
    renderer.destroy();
  });

  it("aborts incremental when blocks index length mismatches dom", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("A\n\nB");
    const model = renderer["session"];
    model.blocks = [
      ...model.blocks.slice(0, 1),
      model.blocks[0]!,
      ...model.blocks.slice(1),
    ];
    expect(model.blocks.length).toBeGreaterThan(mount.childElementCount);

    const result = renderer.render(
      "A\n\nB edited",
      [lineChange(3, 3, 3, 3)],
    );
    expect(result.partial).toBe(false);
    renderer.destroy();
  });

  it("patches only changed paragraph when appending text", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello");

    const h1 = mount.querySelector("h1")!;
    const h1Html = h1.outerHTML;

    const result = renderer.render("# Title\n\nHello world", [lineChange(3, 3, 3, 3)]);
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

    const result = renderer.render("# Title\n\nHello", [lineChange(3, 3, 3, 3)]);
    expect(result.partial).toBe(true);
    expect(mount.querySelector("h1")!.outerHTML).toBe(h1Html);
    expect(mount.querySelector("p")!.textContent).toBe("Hello");

    renderer.destroy();
  });

  it("syncs DOM when deleting a middle block", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("A\n\nB\n\nC\n\nD");

    const result = renderer.render("A\n\nC\n\nD", [lineChange(3, 4, 3, 2)]);
    expect(result.partial).toBe(true);
    expect(mount.children.length).toBe(3);
    expect([...mount.children].map((el) => el.textContent?.trim())).toEqual([
      "A",
      "C",
      "D",
    ]);

    renderer.destroy();
  });

  it("incrementally updates heading when slug option is enabled", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Hello\n\nBody");

    const result = renderer.render("# Hello!\n\nBody", [lineChange(1, 1, 1, 1)]);
    expect(result.partial).toBe(true);
    expect(mount.querySelector("h1")!.textContent).toBe("Hello!");
    expect(mount.querySelector("p")!.textContent).toBe("Body");

    renderer.destroy();
  });

  it("syncs after line numbers shift without missing-dom", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("line0\n\nline1\n\nline2");

    const result = renderer.render(
      "prefix\n\nline0\n\nline1\n\nline2",
      [lineChange(1, 0, 1, 2)],
    );
    expect(result.partial).toBe(true);
    expect(mount.children.length).toBe(4);

    renderer.destroy();
  });

  it("keeps data-hash on reused paragraph after incremental patch", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello");
    const p = mount.querySelector("p")!;

    renderer.render("# Title\n\nHello world", [lineChange(3, 3, 3, 3)]);

    expect(mount.querySelector("p")).not.toBe(p);
    expect(mount.querySelector("p")!.textContent).toContain("Hello world");

    renderer.destroy();
  });

  it("preserves DOM node refs when hash is unchanged", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello");

    const h1 = mount.querySelector("h1");
    const p = mount.querySelector("p");

    const result = renderer.render("# Title\n\nHello", [lineChange(3, 3, 3, 3)]);
    expect(result.partial).toBe(true);
    expect(mount.querySelector("h1")).toBe(h1);
    expect(mount.querySelector("p")).toBe(p);

    renderer.destroy();
  });

  it("reorders blocks via line-based dom sync", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("Prefix\n\nA\n\nB\n\nC");

    const result = renderer.render("Prefix\n\nC\n\nB\n\nA", [lineChange(3, 7, 3, 7)]);
    expect(result.partial).toBe(true);
    expect([...mount.children].map((el) => el.textContent?.trim())).toEqual([
      "Prefix",
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

    const result = renderer.render("# Hello\n\nBody\n\nTail", [lineChange(5, 5, 5, 7)]);
    expect(result.partial).toBe(false);
    expect(mount.querySelector("p")!.textContent).toBe("Body");

    renderer.destroy();
  });

  it("keeps unchanged heading DOM when only paragraph changes", () => {
    const { renderer, mount } = createRenderer();
    renderer.render("# Title\n\nHello");

    const h1 = mount.querySelector("h1")!;
    renderer.render("# Title\n\nHello world", [lineChange(3, 3, 3, 3)]);
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

  it("incrementally updates footnote definition when edited", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("See[^a]\n\n[^a]: note\n\nAfter");

    const result = renderer.render(
      "See[^a]\n\n[^a]: note edited\n\nAfter",
      [lineChange(3, 3, 3, 3)],
    );
    expect(result.partial).toBe(true);
    expect(mount.textContent).toContain("note edited");
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

  it("test.md: editing GFM heading keeps media DOM and block count", () => {
    const md = readFileSync(resolve(import.meta.dirname, "../../demo/test.md"), "utf8");
    const lines = normalizeMarkdownLines(md);
    const gfmLine1 = lines.findIndex((l) => l === "## GFM 标准语法") + 1;

    const { renderer, mount } = createRenderer();
    renderer.renderFull(md);
    expect(mount.childElementCount).toBe(renderer.getMountedBlocks().length);

    const videoEl = mount.querySelector("video")!;
    const blockCountBefore = renderer.getMountedBlocks().length;

    const nextMd = md.replace(
      "## GFM 标准语法",
      "## GFM 标准语法杀杀杀杀杀杀杀杀杀杀杀杀杀",
    );
    const result = renderer.render(nextMd, [
      lineChange(gfmLine1, gfmLine1, gfmLine1, gfmLine1),
    ]);

    expect(result.partial).toBe(true);
    expect(renderer.getMountedBlocks().length).toBe(blockCountBefore);
    expect(mount.childElementCount).toBe(blockCountBefore);
    expect(mount.querySelector("video")).toBe(videoEl);

    renderer.destroy();
  });

  it("test.md: frontmatter edit keeps media DOM nodes", () => {
    const md = readFileSync(resolve(import.meta.dirname, "../../demo/test.md"), "utf8");
    const { renderer, mount } = createRenderer();
    renderer.renderFull(md);

    const videoEl = mount.querySelector("video")!;
    const audioEl = mount.querySelector("audio")!;
    expect(videoEl).toBeTruthy();
    expect(audioEl).toBeTruthy();

    const nextMd = md.replace("title: Cherry Markdown Next", "title: Cherry Markdown Next X");
    const result = renderer.render(nextMd, [lineChange(2, 2, 2, 2)]);
    expect(result.partial).toBe(true);
    expect(mount.querySelector("h1")!.textContent).toContain("Cherry Markdown Next X");
    expect(mount.querySelector("video")).toBe(videoEl);
    expect(mount.querySelector("audio")).toBe(audioEl);

    renderer.destroy();
  });

  it("preserves iframe DOM when editing unrelated paragraph", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("Before\n\n!iframe[Demo](https://example.com)\n\nAfter");

    const iframe = mount.querySelector("iframe")!;
    expect(iframe).toBeTruthy();

    const result = renderer.render(
      "Before\n\n!iframe[Demo](https://example.com)\n\nAfter edited",
      [lineChange(5, 5, 5, 5)],
    );
    expect(result.partial).toBe(true);
    expect(mount.querySelector("iframe")).toBe(iframe);

    renderer.destroy();
  });

  it("preserves iframe DOM on noop incremental pass", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("!iframe[Demo](https://example.com)\n");

    const iframe = mount.querySelector("iframe")!;
    renderer.render("!iframe[Demo](https://example.com)\n", [lineChange(1, 1, 1, 1)]);
    expect(mount.querySelector("iframe")).toBe(iframe);

    renderer.destroy();
  });

  it("incremental update with invisible footnote def anchors via full ast spans", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("Before\n\n[^a]: note\n\nAfter");

    const result = renderer.render(
      "Before edited\n\n[^a]: note\n\nAfter",
      [lineChange(1, 1, 1, 1)],
    );
    expect(result.partial).toBe(true);
    expect(mount.textContent).toContain("Before edited");
    expect(renderer.getMountedBlocks().length).toBe(mount.childElementCount);
    renderer.destroy();
  });

  it("incremental update with frontmatter invisible block uses ast span anchor", () => {
    const { renderer, mount } = createRenderer();
    renderer.renderFull("---\ntitle: Hi\n---\n\nBody");

    const result = renderer.render(
      "---\ntitle: Hello\n---\n\nBody",
      [lineChange(2, 2, 2, 2)],
    );
    expect(result.partial).toBe(true);
    expect(mount.textContent).toContain("Body");
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
