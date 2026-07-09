import { expect, it } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine";
import { SOURCE_LINE_ATTR } from "@/transformer/utils/sourceLine.js";

it("tags top-level blocks with data-hash when sourceLineMap is enabled", () => {
  const engine = new TransformerEngine({
    renderOptions: { sourceLineMap: true },
  });
  const html = engine.render(engine.parse("# Hello\n\nWorld\n"));
  expect(html).toMatch(/<h1[^>]*data-hash="/);
  expect(html).toMatch(/<p[^>]*data-hash="/);
  expect(html).not.toContain(SOURCE_LINE_ATTR);
});
