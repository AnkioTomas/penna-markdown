import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("skips escaped percent openers for inline comment", () => {
  expect(renderMarkdown(createEngine(), String.raw`\%% hidden %%`)).toBe(
    "<p>%% hidden %%</p>\n",
  );
});
