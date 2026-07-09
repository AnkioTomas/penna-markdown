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
  '<div class="cherry-math cherry-math-block" data-type="mathBlock"><img class="cherry-math-latex" data-latex="E=mc^2" data-inline="false" alt="E=mc^2" src="https://math-api-delta.vercel.app/?from=E%3Dmc%5E2" loading="lazy" /></div>';
const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("renders ```math as normal fenced code", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "```math\n\\frac{a}{b}\n```");
  expect(html).toBe(
    '<pre><code class="language-math">\\frac{a}{b}\n</code></pre>\n',
  );
});
