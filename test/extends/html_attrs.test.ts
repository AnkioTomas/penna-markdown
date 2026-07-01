import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("html_attrs extension", () => {
  const transformer = createEngine();

  it("injects attrs into previous inline tag", () => {
    const html = renderMarkdown(transformer, '**bold**{class="x"}');
    expect(html).toBe('<p><strong class="x">bold</strong></p>\n');
  });

  it("keeps invalid brace syntax as text", () => {
    const html = renderMarkdown(transformer, "{123}");
    expect(html).toBe("<p>{123}</p>\n");
  });

  it("parses simplified .class syntax", () => {
    const html = renderMarkdown(transformer, "**bold**{.highlight}");
    expect(html).toBe('<p><strong class="highlight">bold</strong></p>\n');
  });

  it("parses simplified #id syntax", () => {
    const html = renderMarkdown(transformer, "**bold**{#special}");
    expect(html).toBe('<p><strong id="special">bold</strong></p>\n');
  });

  it("parses mixed #id and .class syntax", () => {
    const html = renderMarkdown(transformer, "**bold**{#id .class}");
    expect(html).toBe('<p><strong id="id" class="class">bold</strong></p>\n');
  });

  it("parses multiple .class syntax", () => {
    const html = renderMarkdown(transformer, "**bold**{.a .b .c}");
    expect(html).toBe('<p><strong class="a b c">bold</strong></p>\n');
  });

  it("supports combined simplified and traditional syntax", () => {
    const html = renderMarkdown(transformer, "**bold**{#id .class data-x=\"1\"}");
    expect(html).toBe('<p><strong id="id" data-x="1" class="class">bold</strong></p>\n');
  });

  it("parses traditional syntax still works", () => {
    const html = renderMarkdown(transformer, '**bold**{class="highlight" data-a="1"}');
    expect(html).toBe('<p><strong data-a="1" class="highlight">bold</strong></p>\n');
  });
});
