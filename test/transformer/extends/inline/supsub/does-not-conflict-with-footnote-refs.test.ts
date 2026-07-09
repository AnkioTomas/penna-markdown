import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not conflict with footnote refs", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "text[^1] end");
  expect(html).toBe("<p>text[^1] end</p>\n");
});
