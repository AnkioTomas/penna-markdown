import { describe, expect, it } from "vitest";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";
import {
  analyzeCollapsedCode,
  isCollapseMarkerLine,
} from "@/transformer/extends/utils/collapsedCode.js";
import { parseFenceMeta } from "@/transformer/extends/utils/parseFenceMeta.js";

describe("extends/collapsedCode", () => {
  const engine = () => createTransformerWithExtensions(["code_block"]);

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
    const { html } = engine().render(md);
    expect(html).toContain("cherry-code-block__panel--collapsible");
    expect(html).toContain("cherry-code-block__panel--collapsed");
    expect(html).toContain('class="cherry-code-block__expand"');
    expect(html).toContain('data-cherry-collapsed="1"');
    expect(html).toContain('class="line cherry-code-block__line--folded"');
    expect(html).not.toContain("... more code");
    expect(html).toContain("body {");
  });
});
