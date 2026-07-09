import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not conflict with inline links", () => {
  const html = renderMarkdown(createEngine(), "[链接](https://example.com)");
  expect(html).toBe('<p><a href="https://example.com">链接</a></p>\n');
});
