import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

const MATH_IMG =
  '<div class="Cherry-Math" data-type="mathBlock"><img class="Cherry-Math-Latex" alt="latex" src="https://math.vercel.app/?from=E%3Dmc%5E2&color=black" /></div>';
const MATH_FRAC_IMG =
  '<div class="Cherry-Math" data-type="mathBlock"><img class="Cherry-Math-Latex" alt="latex" src="https://math.vercel.app/?from=%5Cfrac%7Ba%7D%7Bb%7D&color=black" /></div>';
const ECHARTS_IMG =
  '<div data-type="echarts" class="cherry-echarts-block"><img class="echart-container" style="max-width: 100%" src="https://echarts-api.vercel.app?data=%7B%22theme%22%3A%22%22%2C%22width%22%3A600%2C%22height%22%3A400%2C%22options%22%3A%7B%22series%22%3A%5B%7B%22type%22%3A%22bar%22%7D%5D%7D%7D" alt="" /></div>';

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

  it("renders ```echarts fenced block via echarts API", () => {
    const md = "```echarts\n{\"series\":[{\"type\":\"bar\"}]}\n```";
    const { html } = engine().render(md);
    expect(html).toBe(`${ECHARTS_IMG}\n`);
  });

  it("renders ```math fenced block as math API", () => {
    const { html } = engine().render("```math\n\\frac{a}{b}\n```");
    expect(html).toBe(`${MATH_FRAC_IMG}\n`);
  });

  it("falls back to normal code when extension disabled", () => {
    const { html } = base().render("$$\nE=mc^2\n$$");
    expect(html).toBe("<p>$$\nE=mc^2\n$$</p>\n");
  });

  it("falls back to normal fenced code for js when extension enabled", () => {
    const { html } = engine().render("```js\nconst a = 1;\n```");
    expect(html).toBe('<pre><code class="language-js">const a = 1;\n</code></pre>\n');
  });
});
