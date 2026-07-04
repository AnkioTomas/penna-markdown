import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

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
  const engine = () => createEngine();

  it("strips YAML frontmatter from HTML output", () => {
    const html = renderMarkdown(engine(), "---\ntitle: Hi\n---\n\nBody");
    expect(html).toBe("<p>Body</p>\n");
  });

  it("resolves [[name]] anywhere in the document", () => {
    const html = renderMarkdown(engine(), MD);
    expect(html).toContain("<h1>Hello World</h1>");
    expect(html).toContain("By Alice, tags:");
    expect(html).toContain("docs, demo");
    expect(html).not.toContain("[&quot;docs&quot;");
    expect(html).toContain("<p>Unknown: [[missing]]</p>");
    expect(html).toContain("<code>[[title]]</code>");
  });

  it("stores frontMatter in ParserStore", () => {
    const ast = engine().parse("---\ntitle: Hi\n---\n\n# [[title]]");
    const store = ast.props?.store as { get(key: string): unknown } | undefined;
    expect(store?.get("frontMatter")).toEqual({ title: "Hi" });
  });

  it("formats string arrays as comma-separated text", () => {
    const html = renderMarkdown(
      engine(),
      `---
tags:
  - markdown
  - gfm
---
[[tags]]`,
    );
    expect(html).toBe("<p>markdown, gfm</p>\n");
  });

  it("does not resolve variables inside inline code", () => {
    const html = renderMarkdown(engine(), "---\nversion: 0.1.0\n---\n\n`[[version]]`\n");
    expect(html).toBe("<p><code>[[version]]</code></p>\n");
  });
});
