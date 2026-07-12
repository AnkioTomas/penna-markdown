import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
const MATH_BLOCK =
  '<div class="cherry-math cherry-math-block" data-type="mathBlock"><img class="cherry-math-latex" data-latex="E=mc^2" data-inline="false" alt="E=mc^2" src="https://math-api-delta.vercel.app/?from=E%3Dmc%5E2" loading="lazy" /></div>';

const MATH_INLINE_EULER =
  '<span class="cherry-math cherry-math-inline" data-type="mathInline"><img class="cherry-math-latex" data-latex="e^{i\\pi}+1=0" data-inline="true" alt="e^{i\\pi}+1=0" src="https://math-api-delta.vercel.app/?inline=e%5E%7Bi%5Cpi%7D%2B1%3D0" loading="lazy" /></span>';

const MATH_INLINE_R2 =
  '<span class="cherry-math cherry-math-inline" data-type="mathInline"><img class="cherry-math-latex" data-latex="\\mathbb{R}^2" data-inline="true" alt="\\mathbb{R}^2" src="https://math-api-delta.vercel.app/?inline=%5Cmathbb%7BR%7D%5E2" loading="lazy" /></span>';

it("renders inline math with single dollar delimiters", () => {
  const engine = () => createEngine();
  const md =
    "Euler's identity $e^{i\\pi}+1=0$ is a beautiful formula in $\\mathbb{R}^2$.\n";
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain(MATH_INLINE_EULER);
  expect(html).toContain(MATH_INLINE_R2);
  expect(html).toContain("Euler's identity ");
  expect(html).toContain(" is a beautiful formula in ");
});
