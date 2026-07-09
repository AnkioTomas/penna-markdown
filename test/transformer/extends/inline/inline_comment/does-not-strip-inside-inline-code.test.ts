import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not strip inside inline code", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "use `%% keep %%` here");
  expect(html).toBe("<p>use <code>%% keep %%</code> here</p>\n");
});
