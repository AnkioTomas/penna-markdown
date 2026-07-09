import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 584: collapsed reference image", () => {
  const transformer = createEngine();
  const markdown =
    '![foo *bar*][]\n\n[foo *bar*]: train.jpg "train & tracks"\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe(
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>\n',
  );
});
