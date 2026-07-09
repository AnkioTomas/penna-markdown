import { expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine";

it("does not output id when slug is disabled", () => {
  const engine = new TransformerEngine();
  const html = engine.render(engine.parse("# Hello\n"));
  expect(html).toContain("<h1>Hello</h1>");
  expect(html).not.toContain('id="');
});
