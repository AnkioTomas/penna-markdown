import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports query strings in url", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    "!iframe[演示](https://example.com/path?q=1&x=2)\n",
  );
  expect(html).toContain('src="https://example.com/path?q=1&amp;x=2"');
  expect(html).toContain("<iframe");
});
