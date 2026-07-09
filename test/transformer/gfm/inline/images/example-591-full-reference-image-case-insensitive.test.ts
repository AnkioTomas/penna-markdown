import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 591: full reference image case-insensitive", () => {
  const transformer = createEngine();
  const markdown = "![foo][bar]\n\n[BAR]: /url\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><img src="/url" alt="foo" /></p>\n');
});
