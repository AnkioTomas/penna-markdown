import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("filters non-whitelisted keys and injection values", () => {
  const md = `::: cols
@col background=url(x) position=fixed width=100px flex="0 0 auto"
左列
@col
右列
:::`;
  const html = renderMarkdown(createEngine(), md);

  expect(html).toContain(
    '<div class="penna-cols__col" style="width:100px;flex:0 0 auto">',
  );
  expect(html).not.toContain("background");
  expect(html).not.toContain("position");
  expect(html).not.toContain("url(");
});
