import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 659: hard line break inside emphasis", () => {
  const transformer = createEngine();
  expect(renderMarkdown(createEngine(), "*foo\\\nbar*\n")).toBe(
    "<p><em>foo<br />\nbar</em></p>\n",
  );
});
