import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";
import { buildEchartsImageSrc } from "@/transformer/extends/block/specialCode.js";

const ECHARTS_OPTIONS = '{"series":[{"type":"bar"}]}';

it("renders line highlights for js{1,4,6-8}", () => {
  const engine = () => createEnhancedEngine();
  const md = [
    "```js{1,4,6-8}",
    "export default {",
    "  data () {",
    "    return {",
    "      msg: 'hi',",
    "    }",
    "  }",
    "}",
    "```",
  ].join("\n");
  const html = renderMarkdown(createEnhancedEngine(), md);
  expect(html).toContain('data-penna-highlight-lines="1,4,6,7,8"');
  expect(html).toContain('class="penna-code-block__body"');
  expect(html).toContain('class="penna-code-block__gutter"');
  expect(html).toContain("--penna-line-count:");
  expect(html).toContain("--penna-line-highlight-bg:linear-gradient");
  expect(html).toContain("export default {");
  expect(html).toContain('class="penna-code-block__lang">js</span>');
});
