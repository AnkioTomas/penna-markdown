import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports link title attribute", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    '!iframe[演示](https://example.com "页面说明")\n',
  );
  expect(html).toContain('title="页面说明"');
});
