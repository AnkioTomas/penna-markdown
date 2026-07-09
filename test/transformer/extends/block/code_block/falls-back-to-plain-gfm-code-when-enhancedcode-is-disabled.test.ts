import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("falls back to plain GFM code when enhancedCode is disabled", () => {
  const engine = () => createEnhancedEngine();
  const html = renderMarkdown(createEngine(), "```js\nconst a = 1;\n```");
  expect(html).toContain('<pre><code class="language-js">');
  expect(html).not.toContain("cherry-code-block");
});
