import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("interrupts paragraph", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "1\n%%%\nhidden\n%%%\n2");
  expect(html).toBe("<p>1</p>\n<p>2</p>\n");
});
