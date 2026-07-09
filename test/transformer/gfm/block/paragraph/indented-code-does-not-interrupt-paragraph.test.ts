import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("indented code does NOT interrupt paragraph", () => {
  const input = "foo\n    bar";
  const html = renderMarkdown(createEngine(), input);
  expect(html).toBe("<p>foo\nbar</p>\n");
});
