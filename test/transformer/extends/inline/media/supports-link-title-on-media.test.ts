import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports link title on media", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    '!video[演示](https://example.com/demo.mp4 "说明")\n',
  );
  expect(html).toContain('title="说明"');
});
