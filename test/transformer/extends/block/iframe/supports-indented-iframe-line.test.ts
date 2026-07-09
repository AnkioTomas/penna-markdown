import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports indented iframe line", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    "  !iframe[演示](https://example.com)\n",
  );
  expect(html).toContain('src="https://example.com"');
});
