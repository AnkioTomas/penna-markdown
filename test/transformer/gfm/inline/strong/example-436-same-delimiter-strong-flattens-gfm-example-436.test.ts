import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("same-delimiter strong flattens (GFM example 436)", () => {
  const html = renderMarkdown(createEngine(), "**outer **inner** outer**");
  expect(html).toBe("<p><strong>outer inner outer</strong></p>\n");
});
