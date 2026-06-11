import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

const MATH_BLOCK =
  '<div class="cherry-math cherry-math-block" data-type="mathBlock"><img class="cherry-math-latex" alt="E=mc^2" src="https://math.vercel.app/?from=E%3Dmc%5E2&color=black" loading="lazy" /></div>';

const MATH_INLINE_EULER =
  '<span class="cherry-math cherry-math-inline" data-type="mathInline"><img class="cherry-math-latex" alt="e^{i\\pi}+1=0" src="https://math.vercel.app/?from=e%5E%7Bi%5Cpi%7D%2B1%3D0&color=black" loading="lazy" /></span>';

const MATH_INLINE_R2 =
  '<span class="cherry-math cherry-math-inline" data-type="mathInline"><img class="cherry-math-latex" alt="\\mathbb{R}^2" src="https://math.vercel.app/?from=%5Cmathbb%7BR%7D%5E2&color=black" loading="lazy" /></span>';

describe("extends/math", () => {
  const engine = () => createTransformerWithExtensions(["cherry_syntax"]);

  it("renders inline math with single dollar delimiters", () => {
    const md =
      "Euler's identity $e^{i\\pi}+1=0$ is a beautiful formula in $\\mathbb{R}^2$.\n";
    const { html } = engine().render(md);
    expect(html).toContain(MATH_INLINE_EULER);
    expect(html).toContain(MATH_INLINE_R2);
    expect(html).toContain("Euler's identity ");
    expect(html).toContain(" is a beautiful formula in ");
  });

  it("renders block math with $$ on separate lines", () => {
    const md = "$$\nE=mc^2\n$$\n";
    const { html } = engine().render(md);
    expect(html).toBe(`${MATH_BLOCK}\n`);
  });

  it("renders block math with $$ on one line", () => {
    const { html } = engine().render("$$E=mc^2$$\n");
    expect(html).toBe(`${MATH_BLOCK}\n`);
  });

  it("renders multiline block math", () => {
    const md = `$$
\\frac {\\partial^r} {\\partial \\omega^r}
= \\left(\\frac {y^{\\omega}} {\\omega}\\right)
$$`;
    const { html } = engine().render(md);
    expect(html).toContain('class="cherry-math cherry-math-block"');
    expect(html).toContain("math.vercel.app");
    expect(html).toContain("\\frac");
  });

  it("does not treat $$ as inline math", () => {
    const { html } = engine().render("$$E=mc^2$$\n");
    expect(html).not.toContain("mathInline");
  });

  it("is disabled without extension", () => {
    const md = "Euler $e^{i\\pi}+1=0$ and $$\nE=mc^2\n$$\n";
    const { html } = createTransformer().render(md);
    expect(html).not.toContain("cherry-math");
    expect(html).toContain("$e^{i\\pi}+1=0$");
  });
});
