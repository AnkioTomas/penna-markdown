import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders subscript with ~text~", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "H~2~O");
  expect(html).toBe("<p>H<sub>2</sub>O</p>\n");
});
