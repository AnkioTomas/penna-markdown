import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("supports video poster attribute", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    "!video[带封面](https://example.com/demo.mp4){poster=https://example.com/poster.png}\n",
  );
  expect(html).toContain('poster="https://example.com/poster.png"');
  expect(html).toContain('class="penna-media penna-video"');
});
