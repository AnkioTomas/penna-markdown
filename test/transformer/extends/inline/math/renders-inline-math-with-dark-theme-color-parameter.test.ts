import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
const MATH_BLOCK =
  '<div class="penna-math penna-math-block" data-type="mathBlock"><img class="penna-math-latex" data-latex="E=mc^2" data-inline="false" alt="E=mc^2" src="https://math-api-delta.vercel.app/?from=E%3Dmc%5E2" loading="lazy" /></div>';

const MATH_INLINE_EULER =
  '<span class="penna-math penna-math-inline" data-type="mathInline"><img class="penna-math-latex" data-latex="e^{i\\pi}+1=0" data-inline="true" alt="e^{i\\pi}+1=0" src="https://math-api-delta.vercel.app/?inline=e%5E%7Bi%5Cpi%7D%2B1%3D0" loading="lazy" /></span>';

const MATH_INLINE_R2 =
  '<span class="penna-math penna-math-inline" data-type="mathInline"><img class="penna-math-latex" data-latex="\\mathbb{R}^2" data-inline="true" alt="\\mathbb{R}^2" src="https://math-api-delta.vercel.app/?inline=%5Cmathbb%7BR%7D%5E2" loading="lazy" /></span>';

it("renders inline math with dark theme color parameter", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine({ isDark: true }), "$x^2$");
  expect(html).toContain("&color=white");
});
