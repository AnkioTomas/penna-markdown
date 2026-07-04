import { describe, expect, it } from "vitest";
import {
  collectHighlightSpans,
  DEFAULT_INLINE_HIGHLIGHT_CLASSES,
} from "@/editor/highlightSpans.js";

describe("collectHighlightSpans", () => {
  it("highlights ==highlight== inline syntax", () => {
    const md = "before ==高亮== after";
    const spans = collectHighlightSpans(md);
    const hit = spans.find((s) => s.class === DEFAULT_INLINE_HIGHLIGHT_CLASSES.highlight);
    expect(hit).toBeDefined();
    expect(md.slice(hit!.from, hit!.to)).toBe("==高亮==");
  });

  it("highlights alert block lines", () => {
    const md = "> [!NOTE]\n> alert body\n";
    const spans = collectHighlightSpans(md);
    expect(spans.some((s) => s.class === "cm-ext-alert")).toBe(true);
  });

  it("highlights frontmatter fence block", () => {
    const md = "---\ntitle: Hello\n---\n\n# Title\n";
    const spans = collectHighlightSpans(md);
    expect(spans.some((s) => s.class === "cm-ext-frontmatter")).toBe(true);
  });

  it("highlights inline math", () => {
    const md = "Euler $e^{i\\pi}+1=0$ formula";
    const spans = collectHighlightSpans(md);
    const hit = spans.find((s) => s.class === DEFAULT_INLINE_HIGHLIGHT_CLASSES.math_inline);
    expect(hit).toBeDefined();
    expect(md.slice(hit!.from, hit!.to)).toContain("$");
  });

  it("highlights inline comment", () => {
    const md = "visible %% hidden note %% end";
    const spans = collectHighlightSpans(md);
    expect(spans.some((s) => s.class === "cm-ext-comment")).toBe(true);
  });

  it("respects custom inline class map", () => {
    const md = "==custom==";
    const spans = collectHighlightSpans(md, {
      inlineClasses: { highlight: "my-highlight" },
    });
    expect(spans.some((s) => s.class === "my-highlight")).toBe(true);
  });
});
