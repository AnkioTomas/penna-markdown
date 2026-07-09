import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports Chinese shortcodes", () => {
  expect(renderMarkdown(createEngine(), "很棒 :+1:")).toBe("<p>很棒 👍</p>\n");
  expect(renderMarkdown(createEngine(), ":smile:")).toBe("<p>😄</p>\n");
});
