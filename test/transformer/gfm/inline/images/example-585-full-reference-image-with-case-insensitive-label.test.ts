import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 585: full reference image with case-insensitive label", () => {
  const transformer = createEngine();
  const markdown =
    '![foo *bar*][foobar]\n\n[FOOBAR]: train.jpg "train & tracks"\n';
  const html = renderMarkdown(createEngine(), markdown);
  expect(html).toBe(
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>\n',
  );
});
