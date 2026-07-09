import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("GFM example 668: soft line break", () => {
  const html = renderMarkdown(createEngine(), "foo\nbaz\n");
  expect(html).toBe("<p>foo\nbaz</p>\n");
});
