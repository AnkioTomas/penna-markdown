import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 320: backslash escape in fenced code info string", () => {
  const input = "``` foo\\+bar\nfoo\n```\n";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe('<pre><code class="language-foo+bar">foo\n</code></pre>\n');
});
