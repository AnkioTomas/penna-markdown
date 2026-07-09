import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not strip inside fenced code", () => {
  const engine = () => createEngine();
  const md = "```\n%% secret %%\n```";
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe("<pre><code>%% secret %%\n</code></pre>\n");
});
