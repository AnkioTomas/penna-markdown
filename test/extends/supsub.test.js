import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/supsub", () => {
  const engine = () => createTransformerWithExtensions(["supsub"]);

  it("renders superscript with ^text^", () => {
    const { html } = engine().render("E=mc^2^");
    expect(html).toBe("<p>E=mc<sup>2</sup></p>\n");
  });

  it("renders subscript with ^^text^^", () => {
    const { html } = engine().render("H^^2^^O");
    expect(html).toBe("<p>H<sub>2</sub>O</p>\n");
  });

  it("renders mixed sup and sub like cherry example", () => {
    const { html } = engine().render("大头 ^儿子^ 和小头 ^^爸爸^^");
    expect(html).toBe(
      "<p>大头 <sup>儿子</sup> 和小头 <sub>爸爸</sub></p>\n",
    );
  });

  it("supports inline markup inside script", () => {
    const { html } = engine().render("x^*a*^ y");
    expect(html).toBe("<p>x<sup><em>a</em></sup> y</p>\n");
  });

  it("does not conflict with footnote refs", () => {
    const { html } = engine().render("text[^1] end");
    expect(html).toBe("<p>text[^1] end</p>\n");
  });

  it("is disabled without extension", () => {
    const { html } = createTransformer().render("H^^2^^O");
    expect(html).toBe("<p>H^^2^^O</p>\n");
  });
});
