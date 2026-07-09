import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 645: malformed HTML comment openers", () => {
  const transformer = createEngine();
  const markdown = "foo <!--> foo -->\n\nfoo <!---> foo -->\n";
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe(
    "<p>foo <!--> foo --&gt;</p>\n<p>foo <!---> foo --&gt;</p>\n",
  );
});
