import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("skips escaped superscript marker", () => {
  expect(renderMarkdown(createEngine(), String.raw`\^notsup^`)).toBe(
    "<p>^notsup^</p>\n",
  );
});
