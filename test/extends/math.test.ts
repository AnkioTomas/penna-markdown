import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";
import { buildMathImageSrc } from "@/transformer/extends/block/mathBlock.js";

const MATH_BLOCK =
  '<div class="cherry-math cherry-math-block" data-type="mathBlock"><img class="cherry-math-latex" data-latex="E=mc^2" data-inline="false" alt="E=mc^2" src="https://math-api-delta.vercel.app/?from=E%3Dmc%5E2" loading="lazy" /></div>';

const MATH_INLINE_EULER =
  '<span class="cherry-math cherry-math-inline" data-type="mathInline"><img class="cherry-math-latex" data-latex="e^{i\\pi}+1=0" data-inline="true" alt="e^{i\\pi}+1=0" src="https://math-api-delta.vercel.app/?inline=e%5E%7Bi%5Cpi%7D%2B1%3D0" loading="lazy" /></span>';

const MATH_INLINE_R2 =
  '<span class="cherry-math cherry-math-inline" data-type="mathInline"><img class="cherry-math-latex" data-latex="\\mathbb{R}^2" data-inline="true" alt="\\mathbb{R}^2" src="https://math-api-delta.vercel.app/?inline=%5Cmathbb%7BR%7D%5E2" loading="lazy" /></span>';

describe("extends/math", () => {
  const engine = () => createEngine();

  it("buildMathImageSrc omits color by default and supports dark theme", () => {
    expect(buildMathImageSrc("x^2", { inline: true })).toBe(
      "https://math-api-delta.vercel.app/?inline=x%5E2",
    );
    expect(buildMathImageSrc("x^2", { color: "white" })).toBe(
      "https://math-api-delta.vercel.app/?from=x%5E2&color=white",
    );
  });

  it("renders inline math with single dollar delimiters", () => {
    const md =
      "Euler's identity $e^{i\\pi}+1=0$ is a beautiful formula in $\\mathbb{R}^2$.\n";
    const html = renderMarkdown(engine(), md);
    expect(html).toContain(MATH_INLINE_EULER);
    expect(html).toContain(MATH_INLINE_R2);
    expect(html).toContain("Euler's identity ");
    expect(html).toContain(" is a beautiful formula in ");
  });

  it("renders block math with $$ on separate lines", () => {
    const md = "$$\nE=mc^2\n$$\n";
    const html = renderMarkdown(engine(), md);
    expect(html).toBe(`${MATH_BLOCK}\n`);
  });

  it("renders block math with $$ on one line", () => {
    const html = renderMarkdown(engine(), "$$E=mc^2$$\n");
    expect(html).toBe(`${MATH_BLOCK}\n`);
  });

  it("renders multiline block math", () => {
    const md = `$$
\\frac {\\partial^r} {\\partial \\omega^r}
= \\left(\\frac {y^{\\omega}} {\\omega}\\right)
$$`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('class="cherry-math cherry-math-block"');
    expect(html).toContain("math-api-delta.vercel.app");
    expect(html).toContain("\\frac");
    expect(html).not.toContain("&color=");
  });

  it("does not treat $$ as inline math", () => {
    const html = renderMarkdown(engine(), "$$E=mc^2$$\n");
    expect(html).not.toContain("mathInline");
  });
});
