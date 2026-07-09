import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 514: title backslash and HTML entity unescaping", () => {
  const transformer = createEngine();
  const markdown = '[link](/url "title \\\"&quot;")\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe(
    '<p><a href="/url" title="title &quot;&quot;">link</a></p>\n',
  );
});
