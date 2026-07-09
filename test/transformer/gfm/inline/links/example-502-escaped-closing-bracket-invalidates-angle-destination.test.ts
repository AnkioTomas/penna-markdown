import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 502: escaped closing bracket invalidates angle destination", () => {
  const transformer = createEngine();
  const markdown = "[link](<foo\\>)\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe("<p>[link](&lt;foo&gt;)</p>\n");
});
