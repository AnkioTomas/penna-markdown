import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("empty strong should not match", () => {
  const html = renderMarkdown(
    createEngine(),
    "**** is not an empty strong emphasis",
  );
  expect(html).toBe("<p>**** is not an empty strong emphasis</p>\n");
});
