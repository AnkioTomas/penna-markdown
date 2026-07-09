import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("leaves unclosed comment as plain text", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "hello %% still visible");
  expect(html).toBe("<p>hello %% still visible</p>\n");
});
