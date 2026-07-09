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

it("renders ```katex and ```latex as normal fenced code", () => {
  const engine = () => createEngine();
  const katex = renderMarkdown(createEngine(), "```katex\nx^2\n```");
  expect(katex).toBe('<pre><code class="language-katex">x^2\n</code></pre>\n');
  const latex = renderMarkdown(createEngine(), "```latex\nx^2\n```");
  expect(latex).toBe('<pre><code class="language-latex">x^2\n</code></pre>\n');
});
