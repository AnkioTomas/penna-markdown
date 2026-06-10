import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/badge", () => {
  const engine = () => createTransformerWithExtensions(["badge", "html_attrs"]);
  const both = () =>
    createTransformerWithExtensions(["badge", "html_attrs", "frontmatter"]);

  it("renders badge with variant and position via html_attrs", () => {
    const { html } = engine().render("核心库 [必须]{.important .top}");
    expect(html).toBe(
      '<p>核心库 <span class="badge important top">必须</span></p>\n',
    );
  });

  it("renders plain badge with default middle styling", () => {
    const { html } = engine().render("状态 [进行中]");
    expect(html).toBe('<p>状态 <span class="badge">进行中</span></p>\n');
  });

  it("renders warning badge", () => {
    const { html } = engine().render("[标签]{.warning}");
    expect(html).toBe('<p><span class="badge warning">标签</span></p>\n');
  });

  it("renders position-only class", () => {
    const { html } = engine().render("[内容]{.top}");
    expect(html).toBe('<p><span class="badge top">内容</span></p>\n');
  });

  it("does not conflict with inline links", () => {
    const { html } = engine().render("[链接](https://example.com)");
    expect(html).toBe(
      '<p><a href="https://example.com">链接</a></p>\n',
    );
  });

  it("coexists with frontmatter variables", () => {
    const md = `---
title: Front Title
---

# [[title]] and [必须]{.tip .top}`;
    const { html } = both().render(md);
    expect(html).toContain("Front Title");
    expect(html).toContain('<span class="badge tip top">必须</span>');
  });

  it("is disabled without extension", () => {
    const { html } = createTransformer().render("[必须]{.important .top}");
    expect(html).toBe("<p>[必须]{.important .top}</p>\n");
  });
});
