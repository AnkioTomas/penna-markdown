import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 590: full reference image", () => {
  const transformer = createEngine();
  const markdown = "![foo][bar]\n\n[bar]: /url\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><img src="/url" alt="foo" /></p>\n');
});
