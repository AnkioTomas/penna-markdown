import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders !video[alt](url) as styled figure", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    "!video[演示](https://example.com/demo.mp4)\n",
  );
  expect(html).toBe(
    '<figure class="cherry-media cherry-video"><video class="cherry-media__player" src="https://example.com/demo.mp4" controls playsinline preload="metadata"></video><figcaption class="cherry-media__caption">演示</figcaption></figure>\n',
  );
});
