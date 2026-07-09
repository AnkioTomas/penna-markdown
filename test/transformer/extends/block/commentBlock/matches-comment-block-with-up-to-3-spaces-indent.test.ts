import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("matches comment block with up to 3 spaces indent", () => {
  const engine = () => createEngine();
  const md = "1\n\n   %%%\n    hidden\n   %%%\n\n2";
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe("<p>1</p>\n<p>2</p>\n");
});
