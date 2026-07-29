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
  // 源码只有 7 行，spec 里的第 8 行不存在
  expect(
    html.match(
      /class="penna-code-block__line penna-code-block__line--highlight"/g,
    ),
  ).toHaveLength(4);
  expect(html).toContain(
    '<span class="penna-code-block__line penna-code-block__line--highlight">export default {</span>',
  );
  expect(html).toContain(
    '<span class="penna-code-block__line">  data () {</span>',
  );
  expect(html).toContain('class="penna-code-block__lang">js</span>');
});
