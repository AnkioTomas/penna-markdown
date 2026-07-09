import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("removes single line %%% comment %%% from rendered HTML", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(engine(), "1\n\n%%% this is a comment %%%\n\n2");
  expect(html).toBe("<p>1</p>\n<p>2</p>\n");
});
