import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("GFM example 669: soft line break strips line edge spaces", () => {
  const html = renderMarkdown(createEngine(), "foo \n baz\n");
  expect(html).toBe("<p>foo\nbaz</p>\n");
});
