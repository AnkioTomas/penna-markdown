import { describe, expect, it } from "vitest";
import { createEngine, createEngineWithExtensions, renderMarkdown } from "../helpers/engine.js";

const MD = `---
title: Hello World
author:
  name: Alice
tags:
  - docs
  - demo
---

# [[title]]

By [[author.name]], tags: [[tags]]

Unknown: [[missing]]

\`[[title]]\`
`;

describe("extends/frontmatter", () => {
  const engine = () => createEngineWithExtensions(["frontmatter"]);
  const base = () => createEngine();

  it("strips YAML frontmatter from HTML output", () => {
    const html = renderMarkdown(engine(), "---\ntitle: Hi\n---\n\nBody");
    expect(html).toBe("<p>Body</p>\n");
  });

  it("resolves [[name]] anywhere in the document", () => {
    const html = renderMarkdown(engine(), MD);
    expect(html).toContain("<h1>Hello World</h1>");
    expect(html).toContain("By Alice, tags:");
    expect(html).toContain("[&quot;docs&quot;,&quot;demo&quot;]");
    expect(html).toContain("<p>Unknown: [[missing]]</p>");
    expect(html).toContain("<code>[[title]]</code>");
  });

  it("attaches frontMatter to root AST", () => {
    const { ast } = engine().parse("---\ntitle: Hi\n---\n\n# [[title]]");
    expect(ast.frontMatter).toEqual({ title: "Hi" });
  });

  it("leaves syntax unchanged when extension disabled", () => {
    const html = renderMarkdown(base(), "# [[title]]\n");
    expect(html).toBe("<h1>[[title]]</h1>\n");
  });
});
