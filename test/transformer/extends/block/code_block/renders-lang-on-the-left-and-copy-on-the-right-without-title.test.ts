import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("renders lang on the left and copy on the right without title", () => {
  const engine = () => createEnhancedEngine();
  const html = renderMarkdown(
    createEnhancedEngine(),
    "```js\nconst a = 1;\n```",
  );
  expect(html).toContain('class="cherry-code-block__lang">js</span>');
  expect(html).not.toContain("cherry-code-block__title");
  expect(html).toContain('class="cherry-copy-code-button"');
  expect(html).toContain("const a = 1;");
});
