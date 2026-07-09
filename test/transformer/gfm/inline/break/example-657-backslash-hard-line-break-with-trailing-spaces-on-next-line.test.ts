import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("Example 657: backslash hard line break with trailing spaces on next line", () => {
  const transformer = createEngine();
  expect(renderMarkdown(createEngine(), "foo\\\n     bar\n")).toBe(
    "<p>foo<br />\nbar</p>\n",
  );
});
