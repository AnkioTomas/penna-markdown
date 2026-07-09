import { expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine";

it("outputs id for setext headings via atx_heading slug option", () => {
  const engine = new TransformerEngine({
    syntaxOptions: { atx_heading: { slug: true } },
  });
  const html = engine.render(engine.parse("Setext title\n---------\n"));
  expect(html).toContain('<h2 id="Setext-title">');
});
