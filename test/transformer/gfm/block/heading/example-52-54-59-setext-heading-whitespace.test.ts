import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("Example 52: setext heading strips leading/trailing whitespace", () => {
  const html = renderMarkdown(createEngine(), "  Foo *bar\nbaz*\t\n====\n");
  expect(html).toBe("<h1>Foo <em>bar\nbaz</em></h1>\n");
});

it("Example 54: setext heading content indent up to three spaces", () => {
  const html = renderMarkdown(
    createEngine(),
    "   Foo\n---\n\n  Foo\n-----\n\n  Foo\n  ===\n",
  );
  expect(html).toBe("<h2>Foo</h2>\n<h2>Foo</h2>\n<h1>Foo</h1>\n");
});

it("Example 59: trailing spaces in setext content do not create hard break", () => {
  const html = renderMarkdown(createEngine(), "Foo  \n-----\n");
  expect(html).toBe("<h2>Foo</h2>\n");
});
