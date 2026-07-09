import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 583: nested link in alt text", () => {
  const transformer = createEngine();
  const markdown = "![foo [bar](/url)](/url2)\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><img src="/url2" alt="foo bar" /></p>\n');
});
