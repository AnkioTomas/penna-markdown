import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("basic asterisk emphasis", () => {
  const html = renderMarkdown(createEngine(), "*italic*");
  expect(html).toBe("<p><em>italic</em></p>\n");
});
