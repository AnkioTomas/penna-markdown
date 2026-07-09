import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders :smile: and :thumbsup:", () => {
  const t = createEngine();
  expect(renderMarkdown(createEngine(), "Hello :smile:")).toBe(
    "<p>Hello 😄</p>\n",
  );
  expect(renderMarkdown(createEngine(), "Good job :thumbsup:")).toBe(
    "<p>Good job 👍</p>\n",
  );
});
