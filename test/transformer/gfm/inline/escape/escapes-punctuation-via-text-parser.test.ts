import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("escapes punctuation via text parser", () => {
  const html = renderMarkdown(
    createEngine(),
    "\\*not emphasized*\n\\# not a heading\n",
  );
  expect(html).toBe("<p>*not emphasized*\n# not a heading</p>\n");
});
