import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 527: nested links with emphasis", () => {
  const transformer = createEngine();
  const markdown = "[foo *[bar [baz](/uri)](/uri)*](/uri)\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe(
    '<p>[foo <em>[bar <a href="/uri">baz</a>](/uri)</em>](/uri)</p>\n',
  );
});
