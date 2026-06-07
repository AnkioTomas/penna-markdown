import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

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
  const engine = () => createTransformerWithExtensions(["frontmatter"]);
  const base = () => createTransformer();

  it("strips YAML frontmatter from HTML output", () => {
    const { html } = engine().render("---\ntitle: Hi\n---\n\nBody");
    expect(html).toBe("<p>Body</p>\n");
  });

  it("resolves [[name]] anywhere in the document", () => {
    const { html } = engine().render(MD);
    expect(html).toContain(
      '<h1><span class="frontmatter-var" data-type="frontmatter" data-var="title">Hello World</span></h1>',
    );
    expect(html).toContain(
      '<span class="frontmatter-var" data-type="frontmatter" data-var="author.name">Alice</span>',
    );
    expect(html).toContain(
      '<span class="frontmatter-var" data-type="frontmatter" data-var="tags">[&quot;docs&quot;,&quot;demo&quot;]</span>',
    );
    expect(html).toContain("<p>Unknown: [[missing]]</p>");
    expect(html).toContain("<code>[[title]]</code>");
  });

  it("attaches frontMatter to root AST", () => {
    const { ast } = engine().parse("---\ntitle: Hi\n---\n\n# [[title]]");
    expect(ast.props.frontMatter).toEqual({ title: "Hi" });
  });

  it("leaves syntax unchanged when extension disabled", () => {
    const { html } = base().render("# [[title]]\n");
    expect(html).toBe("<h1>[[title]]</h1>\n");
  });
});
