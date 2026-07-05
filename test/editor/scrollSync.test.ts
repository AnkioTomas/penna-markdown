/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { TransformerEngine } from "@/transformer/TransformerEngine";
import {
  buildBlockLineAnchors,
  isRenderedTopLevelBlock,
} from "@/editor/preview/scrollSync/blockLineMap";
import {
  SOURCE_END_LINE_ATTR,
  SOURCE_LINE_ATTR,
} from "@/transformer/utils/sourceLine.js";
import {
  measureSyncAnchors,
  blockOffsetTop,
  previewScrollTopForSourceLine,
  sortAnchors,
} from "@/editor/preview/scrollSync/mapScroll.js";

function parseMarkdown(markdown: string) {
  return new TransformerEngine().parse(markdown);
}

describe("buildBlockLineAnchors", () => {
  it("maps rendered top-level blocks to source line ranges", () => {
    const ast = parseMarkdown("# Hello\n\nWorld\n\n```js\n1\n```");
    const anchors = buildBlockLineAnchors(ast);

    expect(anchors).toEqual([
      { startLine: 0, endLine: 1, type: "atx_heading" },
      { startLine: 2, endLine: 3, type: "paragraph" },
      { startLine: 4, endLine: 7, type: "code" },
    ]);
  });

  it("skips blank_line and invisible nodes but keeps line coverage", () => {
    const ast = parseMarkdown("Text[^1]\n\n[^1]: note\n");
    const footnotes = ast.children?.find((node) => node.type === "footnotes");
    expect(footnotes?.length).toBe(0);
    expect(isRenderedTopLevelBlock(footnotes!)).toBe(true);

    const anchors = buildBlockLineAnchors(ast);
    expect(anchors.some((anchor) => anchor.type === "footnotes")).toBe(false);
    expect(anchors).toEqual([{ startLine: 0, endLine: 1, type: "paragraph" }]);
  });
});

describe("scrollSync/measureSyncAnchors", () => {
  it("reads block line map aligned with mount children", () => {
    const dom = new JSDOM(
      `<div id="root">
        <h1>Hello</h1>
        <p>World</p>
      </div>`,
    );
    const root = dom.window.document.getElementById("root") as HTMLElement;
    const anchors = measureSyncAnchors(root, [
      { startLine: 0, endLine: 1 },
      { startLine: 2, endLine: 3 },
    ]);

    expect(anchors.length).toBeGreaterThanOrEqual(4);
    expect(anchors[0]).toMatchObject({ startLine: 0, previewY: 0, type: "block" });
    expect(anchors.some((a) => a.type === "block-end" && a.startLine === 1)).toBe(true);
    expect(anchors.some((a) => a.type === "block" && a.startLine === 2)).toBe(true);
  });

  it("reads source line attrs from rendered blocks when no block map", () => {
    const dom = new JSDOM(
      `<div id="root">
        <h1 ${SOURCE_LINE_ATTR}="0" ${SOURCE_END_LINE_ATTR}="1">Hello</h1>
        <p ${SOURCE_LINE_ATTR}="2" ${SOURCE_END_LINE_ATTR}="3">World</p>
      </div>`,
    );
    const root = dom.window.document.getElementById("root") as HTMLElement;
    const anchors = measureSyncAnchors(root);

    expect(anchors.length).toBeGreaterThanOrEqual(4);
    expect(anchors[0]).toMatchObject({ startLine: 0, previewY: 0, type: "block" });
    expect(anchors.some((a) => a.type === "block-end" && a.startLine === 1)).toBe(true);
    expect(anchors.some((a) => a.type === "block" && a.startLine === 2)).toBe(true);
  });

  it("inserts media anchors inside blocks with images", () => {
    const dom = new JSDOM(
      `<div id="scroll" style="height:400px;overflow:auto">
        <p ${SOURCE_LINE_ATTR}="0" ${SOURCE_END_LINE_ATTR}="3">
          before
          <img id="pic" width="200" height="100" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
          after
        </p>
      </div>`,
    );
    const scroll = dom.window.document.getElementById("scroll") as HTMLElement;
    const img = dom.window.document.getElementById("pic") as HTMLElement;
    Object.defineProperty(img, "offsetHeight", { value: 100 });
    Object.defineProperty(img, "offsetParent", { value: scroll });

    const anchors = measureSyncAnchors(scroll);
    expect(anchors.some((a) => a.type === "media")).toBe(true);
  });

  it("blockOffsetTop accounts for scroll position", () => {
    const dom = new JSDOM(`<div id="scroll" style="height:100px;overflow:auto"><div id="a" style="height:80px"></div><div id="b" style="height:80px"></div></div>`);
    const scroll = dom.window.document.getElementById("scroll") as HTMLElement;
    const b = dom.window.document.getElementById("b") as HTMLElement;
    scroll.scrollTop = 40;
    const y = blockOffsetTop(b, scroll);
    expect(y).toBeGreaterThanOrEqual(40);
  });

  it("media anchors shift preview scroll for lines after image", () => {
    const dom = new JSDOM(`<div id="scroll" style="height:300px;overflow:auto"></div>`);
    const scroll = dom.window.document.getElementById("scroll") as HTMLElement;
    Object.defineProperty(scroll, "scrollHeight", { value: 500 });
    Object.defineProperty(scroll, "clientHeight", { value: 300 });

    const anchors = sortAnchors([
      { startLine: 0, endLine: 0, type: "block", previewY: 0 },
      { startLine: 1, endLine: 1, type: "media", previewY: 200 },
      { startLine: 3, endLine: 3, type: "block-end", previewY: 220 },
    ]);

    const beforeImage = previewScrollTopForSourceLine(0.5, anchors, scroll);
    const afterImage = previewScrollTopForSourceLine(2, anchors, scroll);
    expect(afterImage).toBeGreaterThan(beforeImage);
  });
});
