import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("does not treat inline !iframe as block embed", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    "see !iframe[演示](https://example.com) here\n",
  );
  expect(html).not.toContain("<iframe");
  expect(html).toContain("!iframe");
});
