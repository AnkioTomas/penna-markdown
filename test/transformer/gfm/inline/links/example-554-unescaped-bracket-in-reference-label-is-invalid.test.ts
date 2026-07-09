import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 554: unescaped bracket in reference label is invalid", () => {
  const transformer = createEngine();
  const markdown = "[foo][ref[]\n\n[ref[]: /uri\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe("<p>[foo][ref[]</p>\n<p>[ref[]: /uri</p>\n");
});
