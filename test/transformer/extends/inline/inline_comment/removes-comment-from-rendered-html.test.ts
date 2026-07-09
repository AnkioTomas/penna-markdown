import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("removes %% comment %% from rendered HTML", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    "可见 %% 这一行是写给自己的悄悄话，预览模式和导出时完全不可见 %% 内容",
  );
  expect(html).toBe("<p>可见  内容</p>\n");
});
