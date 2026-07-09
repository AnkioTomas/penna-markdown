import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("rejects empty subscript delimiters", () => {
  expect(renderMarkdown(createEngine(), "~~")).toBe("<p>~~</p>\n");
});
