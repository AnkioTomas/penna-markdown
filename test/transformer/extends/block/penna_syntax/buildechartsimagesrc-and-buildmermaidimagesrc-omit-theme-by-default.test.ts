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

it("buildEchartsImageSrc and buildMermaidImageSrc omit theme by default", () => {
  const engine = () => createEngine();
  expect(buildEchartsImageSrc(ECHARTS_OPTIONS)).not.toContain('"theme"');
  expect(
    decodeURIComponent(
      buildEchartsImageSrc(ECHARTS_OPTIONS, { theme: "dark" }),
    ),
  ).toContain('"theme":"dark"');
  const mermaid = "flowchart TD\n    A --> B";
  expect(buildMermaidImageSrc(mermaid)).not.toContain("theme=");
  expect(buildMermaidImageSrc(mermaid, { theme: "dark" })).toContain(
    "?theme=dark",
  );
});
