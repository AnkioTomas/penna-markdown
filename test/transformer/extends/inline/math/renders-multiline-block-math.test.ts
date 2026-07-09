import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildMathImageSrc } from "@/transformer/extends/block/mathBlock.js";

const MATH_BLOCK =
  '<div class="cherry-math cherry-math-block" data-type="mathBlock"><img class="cherry-math-latex" data-latex="E=mc^2" data-inline="false" alt="E=mc^2" src="https://math-api-delta.vercel.app/?from=E%3Dmc%5E2" loading="lazy" /></div>';

const MATH_INLINE_EULER =
  '<span class="cherry-math cherry-math-inline" data-type="mathInline"><img class="cherry-math-latex" data-latex="e^{i\\pi}+1=0" data-inline="true" alt="e^{i\\pi}+1=0" src="https://math-api-delta.vercel.app/?inline=e%5E%7Bi%5Cpi%7D%2B1%3D0" loading="lazy" /></span>';

const MATH_INLINE_R2 =
  '<span class="cherry-math cherry-math-inline" data-type="mathInline"><img class="cherry-math-latex" data-latex="\\mathbb{R}^2" data-inline="true" alt="\\mathbb{R}^2" src="https://math-api-delta.vercel.app/?inline=%5Cmathbb%7BR%7D%5E2" loading="lazy" /></span>';

it("renders multiline block math", () => {
  const engine = () => createEngine();
  const md = `$$
\\frac {\\partial^r} {\\partial \\omega^r}
= \\left(\\frac {y^{\\omega}} {\\omega}\\right)
$$`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('class="cherry-math cherry-math-block"');
  expect(html).toContain("math-api-delta.vercel.app");
  expect(html).toContain("\\frac");
  expect(html).not.toContain("&color=");
});
