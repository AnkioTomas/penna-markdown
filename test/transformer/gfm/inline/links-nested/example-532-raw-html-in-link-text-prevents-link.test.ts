import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 532: raw HTML in link text prevents link", () => {
  const transformer = createEngine();
  const markdown = '[foo <bar attr="](baz)">\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p>[foo <bar attr="](baz)"></p>\n');
});
