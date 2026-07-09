import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("renders !iframe[title](url) as styled embed", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(engine(), "!iframe[演示](https://example.com)\n");
  expect(html).toBe(
    '<figure class="cherry-media cherry-iframe"><div class="cherry-iframe__frame"><iframe src="https://example.com" title="演示" loading="lazy" allowfullscreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe></div><figcaption class="cherry-media__caption">演示</figcaption></figure>\n',
  );
});
