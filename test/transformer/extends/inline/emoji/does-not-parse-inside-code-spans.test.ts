import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not parse inside code spans", () => {
  const t = createEngine();
  expect(renderMarkdown(createEngine(), "`:smile:`")).toBe(
    "<p><code>:smile:</code></p>\n",
  );
});
