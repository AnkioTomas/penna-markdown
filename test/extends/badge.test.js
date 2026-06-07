import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/badge", () => {
  const engine = () => createTransformerWithExtensions(["badge"]);
  const both = () => createTransformerWithExtensions(["badge", "frontmatter"]);

  it("renders badge with color and position", () => {
    const { html } = engine().render("核心库 [[必须:important,top]]");
    expect(html).toBe(
      '<p>核心库 <span class="cherry-badge cherry-badge-important cherry-badge-top">必须</span></p>\n',
    );
  });

  it("renders plain badge as info center", () => {
    const { html } = engine().render("状态 [[进行中]]");
    expect(html).toBe(
      '<p>状态 <span class="cherry-badge cherry-badge-info cherry-badge-center">进行中</span></p>\n',
    );
  });

  it("renders custom hex color badge", () => {
    const { html } = engine().render("[[标签:#ff0000,center]]");
    expect(html).toBe(
      '<p><span class="cherry-badge cherry-badge-info cherry-badge-center" style="background-color: #ff0000">标签</span></p>\n',
    );
  });

  it("renders position-only second token", () => {
    const { html } = engine().render("[[内容:top]]");
    expect(html).toBe(
      '<p><span class="cherry-badge cherry-badge-info cherry-badge-top">内容</span></p>\n',
    );
  });

  it("yields to frontmatter for simple [[name]] when both enabled", () => {
    const md = `---
title: Front Title
---

# [[title]] and [[必须:tip,top]]`;
    const { html } = both().render(md);
    expect(html).toContain(
      '<span class="frontmatter-var" data-type="frontmatter" data-var="title">Front Title</span>',
    );
    expect(html).toContain(
      '<span class="cherry-badge cherry-badge-tip cherry-badge-top">必须</span>',
    );
  });

  it("is disabled without extension", () => {
    const { html } = createTransformer().render("[[必须:important,top]]");
    expect(html).toBe("<p>[[必须:important,top]]</p>\n");
  });
});
