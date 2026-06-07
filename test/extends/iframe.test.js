import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/iframe", () => {
  const engine = () => createTransformerWithExtensions(["iframe"]);

  it("renders @@url as iframe block", () => {
    const { html } = engine().render("@@https://example.com\n");
    expect(html).toBe(
      '<iframe src="https://example.com" width="100%" height="400px" sandbox="allow-scripts" frameborder="0" loading="lazy" allow="fullscreen"></iframe>\n',
    );
  });

  it("allows optional spaces after @@", () => {
    const { html } = engine().render("@@ https://example.com/path?q=1\n");
    expect(html).toContain('src="https://example.com/path?q=1"');
  });

  it("supports indented iframe line", () => {
    const { html } = engine().render("  @@https://example.com\n");
    expect(html).toContain('src="https://example.com"');
  });

  it("does not treat inline @@ as iframe", () => {
    const { html } = engine().render("see @@https://example.com here\n");
    expect(html).not.toContain("<iframe");
    expect(html).toContain("@@");
  });

  it("rejects non-http schemes", () => {
    const { html } = engine().render("@@javascript:alert(1)\n");
    expect(html).not.toContain("<iframe");
  });

  it("is disabled without extension", () => {
    const { html } = createTransformer().render("@@https://example.com\n");
    expect(html).not.toContain("<iframe");
  });
});
