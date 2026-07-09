import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 555: nested brackets in reference label are invalid", () => {
  const transformer = createEngine();
  const markdown = "[foo][ref[bar]]\n\n[ref[bar]]: /uri\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe("<p>[foo][ref[bar]]</p>\n<p>[ref[bar]]: /uri</p>\n");
});
