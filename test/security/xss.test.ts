import { describe, expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../helpers/engine.js";

describe("security/xss", () => {
  const engine = () => createEngine();

  it("strips script block HTML at render", () => {
    const md = "<script>alert(1)</script>\n\nok";
    const html = renderMarkdown(engine(), md);
    expect(html).not.toContain("<script");
    expect(html).toContain("<p>ok</p>");
  });

  it("strips inline event handlers from raw HTML", () => {
    const md = '<img src="x" onerror="alert(1)">';
    const html = renderMarkdown(engine(), md);
    expect(html).not.toContain("onerror");
    expect(html).toContain("<img");
  });

  it("strips javascript: markdown links", () => {
    const md = "[x](javascript:alert(1))";
    const html = renderMarkdown(engine(), md);
    expect(html).toBe("<p>x</p>\n");
  });

  it("strips event attrs from html_attrs", () => {
    const md = '**x**{onclick="alert(1)"}';
    const html = renderMarkdown(engine(), md);
    expect(html).not.toContain("onclick");
    expect(html).toBe("<p><strong>x</strong></p>\n");
  });

  it("rejects javascript iframe embed", () => {
    const md = "!iframe[x](javascript:alert(1))\n";
    const html = renderMarkdown(engine(), md);
    expect(html).not.toContain("<iframe");
  });

  it("preserves cherry components", () => {
    const md = "- [ ] todo\n\n```js\nconst a = 1;\n```";
    const html = renderMarkdown(createEnhancedEngine(), md);
    expect(html).toContain('class="task-list"');
    expect(html).toContain("cherry-code-block");
    expect(html).toContain('data-state="todo"');
  });
});
