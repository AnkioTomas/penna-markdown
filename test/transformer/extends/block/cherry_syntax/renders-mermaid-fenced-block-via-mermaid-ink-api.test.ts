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

it("renders ```mermaid fenced block via mermaid.ink API", () => {
  const engine = () => createEngine();
  const md = "```mermaid\nflowchart TD\n    Start --> Stop\n```";
  const html = renderMarkdown(createEnhancedEngine(), md);
  expect(html).toContain('<figure data-type="mermaid"');
  expect(html).toContain("https://mermaid.ink/svg/");
  expect(html).toContain('class="cherry-mermaid__img"');
  expect(html).toContain("data-mermaid=");
  expect(html).not.toContain("theme=dark");
});
