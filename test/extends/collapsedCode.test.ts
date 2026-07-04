import { describe, expect, it } from "vitest";
import { createEnhancedEngine, renderMarkdown } from "../helpers/engine.js";
import {
  analyzeCollapsedCode,
  isCollapseMarkerLine,
  parseFenceMeta,
} from "@/transformer/extends/block/enhancedCode.js";

describe("extends/collapsedCode", () => {
  const engine = () => createEnhancedEngine();

  it("detects collapse marker lines", () => {
    expect(isCollapseMarkerLine("... more code")).toBe(true);
    expect(isCollapseMarkerLine("  ...")).toBe(true);
    expect(isCollapseMarkerLine("not marker")).toBe(false);
  });

  it("analyzes marker-based collapse", () => {
    const content = ["html {", "}", "", "... more code", "body {}"].join("\n");
    const analysis = analyzeCollapsedCode(content, { enabled: true });
    expect(analysis.hasMore).toBe(true);
    expect(analysis.visibleCount).toBe(3);
    expect(analysis.markerLine).toBe(4);
  });

  it("parses :collapsed-lines in fence info", () => {
    const meta = parseFenceMeta("```css :collapsed-lines");
    expect(meta?.lang).toBe("css");
    expect(meta?.collapsedLines).toBe(true);
  });

  it("parses :collapsed-lines=5", () => {
    const meta = parseFenceMeta("```css :collapsed-lines=5");
    expect(meta?.collapsedMaxLines).toBe(5);
  });

  it("renders collapsible code block with expand button", () => {
    const md = [
      "```css :collapsed-lines",
      "html {",
      "  margin: 0;",
      "}",
      "",
      "... more code",
      "body {",
      "  color: red;",
      "}",
      "```",
    ].join("\n");
    const html = renderMarkdown(engine(), md);
    expect(html).toContain("cherry-code-block__panel--collapsible");
    expect(html).toContain("cherry-code-block__panel--collapsed");
    expect(html).toContain('class="cherry-code-block__expand"');
    expect(html).toContain('data-cherry-collapsed="1"');
    expect(html).toContain('class="cherry-code-block__body"');
    expect(html).toContain('class="cherry-code-block__gutter"');
    expect(html).toContain("--cherry-collapsed-visible:4");
    expect(html).not.toContain("... more code");
    expect(html).toContain("body {");
  });
});
