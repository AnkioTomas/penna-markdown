import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports nested inline markup", () => {
  const html = renderMarkdown(createEngine(), "!! **加粗剧透** !!\n");
  expect(html).toBe(
    '<p><span class="cherry-spoiler"> <strong>加粗剧透</strong> </span></p>\n',
  );
});
