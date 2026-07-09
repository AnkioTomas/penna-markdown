import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 318: backslash escapes in inline link destination and title", () => {
  const transformer = createEngine();
  const markdown = '[foo](/bar\\* "ti\\*tle")\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe('<p><a href="/bar*" title="ti*tle">foo</a></p>\n');
});
