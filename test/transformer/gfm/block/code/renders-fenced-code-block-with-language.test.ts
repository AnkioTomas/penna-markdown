import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders fenced code block with language", () => {
  const html = renderMarkdown(createEngine(), "```js\nconst a = 1;\n```");
  expect(html).toBe(
    '<pre><code class="language-js">const a = 1;\n</code></pre>\n',
  );
});
