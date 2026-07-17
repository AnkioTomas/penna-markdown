import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("ignores max-width on enhanced code blocks", () => {
  const engine = () => createEnhancedEngine();
  const html = renderMarkdown(
    engine(),
    "```js max-width=720\nconst a = 1;\n```",
  );
  expect(html).toContain('class="penna-code-block"');
  expect(html).not.toContain('style="max-width:720px"');
});
