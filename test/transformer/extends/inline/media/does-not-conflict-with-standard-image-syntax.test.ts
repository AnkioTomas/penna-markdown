import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not conflict with standard image syntax", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(engine(), "![img](https://example.com/a.png)\n");
  expect(html).toBe(
    '<p><img src="https://example.com/a.png" alt="img" /></p>\n',
  );
});
