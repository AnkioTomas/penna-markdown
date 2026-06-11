import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";
import {
  buildEchartsImageSrc,
  buildMermaidImageSrc,
} from "@/transformer/extends/utils/cherryApi.js";

const MATH_IMG =
  '<div class="cherry-math cherry-math-block" data-type="mathBlock"><img class="cherry-math-latex" data-latex="E=mc^2" data-inline="false" alt="E=mc^2" src="https://math-api-delta.vercel.app/?from=E%3Dmc%5E2" loading="lazy" /></div>';
const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

describe("extends/cherry_syntax", () => {
  const engine = () => createTransformerWithExtensions(["cherry_syntax"]);
  const base = () => createTransformer();

  it("renders block math with $$ via math API", () => {
    const { html } = engine().render("$$\nE=mc^2\n$$");
    expect(html).toBe(`${MATH_IMG}\n`);
  });

  it("renders inline-style block math on one line", () => {
    const { html } = engine().render("$$E=mc^2$$");
    expect(html).toBe(`${MATH_IMG}\n`);
  });

  it("buildEchartsImageSrc and buildMermaidImageSrc omit theme by default", () => {
    expect(buildEchartsImageSrc(ECHARTS_OPTIONS)).not.toContain('"theme"');
    expect(decodeURIComponent(buildEchartsImageSrc(ECHARTS_OPTIONS, { theme: "dark" }))).toContain(
      '"theme":"dark"',
    );
    const mermaid = "flowchart TD\n    A --> B";
    expect(buildMermaidImageSrc(mermaid)).not.toContain("theme=");
    expect(buildMermaidImageSrc(mermaid, { theme: "dark" })).toContain("?theme=dark");
  });

  it("renders ```echarts fenced block via echarts API", () => {
    const md = "```echarts\n{\"series\":[{\"type\":\"bar\"}]}\n```";
    const { html } = engine().render(md);
    expect(html).toContain('<div data-type="echarts"');
    expect(html).toContain('class="cherry-echarts__img"');
    expect(html).toContain("data-echarts=");
    expect(html).toContain(buildEchartsImageSrc(ECHARTS_OPTIONS));
    expect(html).not.toContain('"theme"');
  });

  it("renders ```math as normal fenced code", () => {
    const { html } = engine().render("```math\n\\frac{a}{b}\n```");
    expect(html).toBe('<pre><code class="language-math">\\frac{a}{b}\n</code></pre>\n');
  });

  it("renders ```katex and ```latex as normal fenced code", () => {
    const katex = engine().render("```katex\nx^2\n```");
    expect(katex.html).toBe('<pre><code class="language-katex">x^2\n</code></pre>\n');
    const latex = engine().render("```latex\nx^2\n```");
    expect(latex.html).toBe('<pre><code class="language-latex">x^2\n</code></pre>\n');
  });

  it("falls back to normal code when extension disabled", () => {
    const { html } = base().render("$$\nE=mc^2\n$$");
    expect(html).toBe("<p>$$\nE=mc^2\n$$</p>\n");
  });

  it("falls back to normal fenced code for js when extension enabled", () => {
    const { html } = engine().render("```js\nconst a = 1;\n```");
    expect(html).toBe('<pre><code class="language-js">const a = 1;\n</code></pre>\n');
  });

  it("renders ```mermaid fenced block via mermaid.ink API", () => {
    const md = "```mermaid\nflowchart TD\n    Start --> Stop\n```";
    const { html } = engine().render(md);
    expect(html).toContain('<figure data-type="mermaid"');
    expect(html).toContain("https://mermaid.ink/img/");
    expect(html).toContain('class="cherry-mermaid__img"');
    expect(html).toContain("data-mermaid=");
    expect(html).not.toContain("theme=dark");
  });

  it("treats ```graph as mermaid alias", () => {
    const md = "```graph\nflowchart TD\n    A --> B\n```";
    const { html } = engine().render(md);
    expect(html).toContain('<figure data-type="mermaid"');
  });

  it("falls back to normal fenced code for ```card", () => {
    const md = "```card\n#list/1\n[Title](https://example.com) Description\n```";
    const { html } = engine().render(md);
    expect(html).toBe(
      '<pre><code class="language-card">#list/1\n[Title](https://example.com) Description\n</code></pre>\n',
    );
    expect(html).not.toContain("cherry-card-block");
  });
});
