import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("leaves unknown shortcodes as text", () => {
  const t = createEngine();
  expect(renderMarkdown(createEngine(), ":not_a_real_emoji:")).toBe(
    "<p>:not_a_real_emoji:</p>\n",
  );
});
