import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("mixed asterisk and underscore", () => {
  const html = renderMarkdown(createEngine(), "**bold __italic__**");
  expect(html).toBe("<p><strong>bold <strong>italic</strong></strong></p>\n");
});
