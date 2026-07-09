import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 526: nested links use inner-most only", () => {
  const transformer = createEngine();
  const markdown = "[foo [bar](/uri)](/uri)\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p>[foo <a href="/uri">bar</a>](/uri)</p>\n');
});
