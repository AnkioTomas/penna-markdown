import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("mixed emphasis and strong", () => {
  const html = renderMarkdown(createEngine(), "*italic **bold***");
  expect(html).toBe("<p><em>italic <strong>bold</strong></em></p>\n");

  const html2 = renderMarkdown(createEngine(), "**bold *italic***");
  expect(html2).toBe("<p><strong>bold <em>italic</em></strong></p>\n");
});
