import { expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine";

it("outputs id when syntaxOptions.atx_heading.slug is true", () => {
  const engine = new TransformerEngine({
    syntaxOptions: { atx_heading: { slug: true } },
  });
  const html = engine.render(engine.parse("# Hello\n\n## World\n"));
  expect(html).toContain('<h1 id="Hello">');
  expect(html).toContain('<h2 id="World">');
});
