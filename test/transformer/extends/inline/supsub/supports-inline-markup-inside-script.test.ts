import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports inline markup inside script", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "x^*a*^ y");
  expect(html).toBe("<p>x<sup><em>a</em></sup> y</p>\n");
});
