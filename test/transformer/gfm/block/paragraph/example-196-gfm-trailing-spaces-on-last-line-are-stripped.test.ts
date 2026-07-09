import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("GFM example 196: trailing spaces on last line are stripped", () => {
  const html = renderMarkdown(createEngine(), "aaa     \nbbb     \n");
  expect(html).toBe("<p>aaa<br />\nbbb</p>\n");
});
