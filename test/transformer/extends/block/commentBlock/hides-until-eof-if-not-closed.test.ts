import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("hides until EOF if not closed", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "1\n\n%%%\nhidden\nhidden 2");
  expect(html).toBe("<p>1</p>\n");
});
