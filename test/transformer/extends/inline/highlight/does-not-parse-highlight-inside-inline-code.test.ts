import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("does not parse highlight inside inline code", () => {
  expect(renderMarkdown(createEngine(), "`==hello==`")).toBe(
    "<p><code>==hello==</code></p>\n",
  );
});
