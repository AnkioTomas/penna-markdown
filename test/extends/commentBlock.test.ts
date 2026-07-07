import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("extends/commentBlock", () => {
  const engine = () => createEngine();

  it("removes single line %%% comment %%% from rendered HTML", () => {
    const html = renderMarkdown(
      engine(),
      "1\n\n%%% this is a comment %%%\n\n2",
    );
    expect(html).toBe("<p>1</p>\n<p>2</p>\n");
  });

  it("removes multi-line comment block", () => {
    const html = renderMarkdown(
      engine(),
      "1\n\n%%%\nthis is a comment\nacross multiple lines\n%%%\n\n2",
    );
    expect(html).toBe("<p>1</p>\n<p>2</p>\n");
  });

  it("interrupts paragraph", () => {
    const html = renderMarkdown(engine(), "1\n%%%\nhidden\n%%%\n2");
    expect(html).toBe("<p>1</p>\n<p>2</p>\n");
  });

  it("does not match indented code block with 4 or more spaces", () => {
    const md = "1\n\n    %%%\n    hidden\n    %%%";
    const html = renderMarkdown(engine(), md);
    expect(html).toBe("<p>1</p>\n<pre><code>%%%\nhidden\n%%%\n</code></pre>\n");
  });

  it("matches comment block with up to 3 spaces indent", () => {
    const md = "1\n\n   %%%\n    hidden\n   %%%\n\n2";
    const html = renderMarkdown(engine(), md);
    expect(html).toBe("<p>1</p>\n<p>2</p>\n");
  });

  it("hides until EOF if not closed", () => {
    const html = renderMarkdown(engine(), "1\n\n%%%\nhidden\nhidden 2");
    expect(html).toBe("<p>1</p>\n");
  });
});
