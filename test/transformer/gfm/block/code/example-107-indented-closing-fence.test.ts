import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 107: indented closing fence", () => {
  const input = "```\naaa\n    ```\n```";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<pre><code>aaa\n    ```\n</code></pre>\n");
});
