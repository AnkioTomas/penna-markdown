import { describe, expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine";

describe("transformer/headingSlug", () => {
  it("outputs id when syntaxOptions.atx_heading.slug is true", () => {
    const engine = new TransformerEngine({
      syntaxOptions: { atx_heading: { slug: true } },
    });
    const html = engine.render(engine.parse("# Hello\n\n## World\n"));
    expect(html).toContain('<h1 id="Hello">');
    expect(html).toContain('<h2 id="World">');
  });

  it("outputs id for setext headings via atx_heading slug option", () => {
    const engine = new TransformerEngine({
      syntaxOptions: { atx_heading: { slug: true } },
    });
    const html = engine.render(engine.parse("Setext title\n---------\n"));
    expect(html).toContain('<h2 id="Setext-title">');
  });

  it("does not output id when slug is disabled", () => {
    const engine = new TransformerEngine();
    const html = engine.render(engine.parse("# Hello\n"));
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).not.toContain('id="');
  });
});
