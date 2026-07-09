import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 525: image inside link label", () => {
  const transformer = createEngine();
  const markdown = "[![moon](moon.jpg)](/uri)\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe(
    '<p><a href="/uri"><img src="moon.jpg" alt="moon" /></a></p>\n',
  );
});
