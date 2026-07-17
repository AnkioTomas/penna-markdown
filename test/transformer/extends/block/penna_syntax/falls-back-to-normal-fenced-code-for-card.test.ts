import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import {
  buildEchartsImageSrc,
  buildMermaidImageSrc,
} from "@/transformer/extends/block/specialCode.js";

const MATH_IMG =
  '<div class="penna-math penna-math-block" data-type="mathBlock"><img class="penna-math-latex" data-latex="E=mc^2" data-inline="false" alt="E=mc^2" src="https://math-api-delta.vercel.app/?from=E%3Dmc%5E2" loading="lazy" /></div>';
const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("falls back to normal fenced code for ```card", () => {
  const engine = () => createEngine();
  const md = "```card\n#list/1\n[Title](https://example.com) Description\n```";
  const html = renderMarkdown(createEngine(), md);
  expect(html).toBe(
    '<pre><code class="language-card">#list/1\n[Title](https://example.com) Description\n</code></pre>\n',
  );
  expect(html).not.toContain("penna-card-block");
});
