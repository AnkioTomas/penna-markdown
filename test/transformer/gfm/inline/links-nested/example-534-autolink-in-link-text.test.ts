import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 534: autolink in link text", () => {
  const transformer = createEngine();
  const markdown = "[foo<http://example.com/?search=](uri)>\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe(
    '<p>[foo<a href="http://example.com/?search=%5D(uri)">http://example.com/?search=](uri)</a></p>\n',
  );
});
