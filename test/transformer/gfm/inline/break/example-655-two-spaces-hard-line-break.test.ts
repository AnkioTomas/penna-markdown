import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 655: two spaces hard line break", () => {
  const transformer = createEngine();
  expect(renderMarkdown(createEngine(), "foo       \nbaz\n")).toBe(
    "<p>foo<br />\nbaz</p>\n",
  );
});
