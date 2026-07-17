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

it("treats ```graph as mermaid alias", () => {
  const engine = () => createEngine();
  const md = "```graph\nflowchart TD\n    A --> B\n```";
  const html = renderMarkdown(createEnhancedEngine(), md);
  expect(html).toContain('<figure data-type="mermaid"');
});
