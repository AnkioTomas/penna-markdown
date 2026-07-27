import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("keeps nested cols @col from being split by outer layout", () => {
  const md = `::: cols
@col
外左

::: cols
@col
内左
@col
内右
:::
@col
外右
:::`;
  const html = renderMarkdown(createEngine(), md);

  // 外层恰好两列
  const outer = html.match(/<div class="penna-cols">/g) ?? [];
  expect(outer.length).toBe(2); // 外层 + 内层各一个
  expect(html).toContain("<p>内左</p>");
  expect(html).toContain("<p>内右</p>");
  expect(html).toContain("<p>外右</p>");

  // 内层 cols 嵌在外左列内，外右列独立存在
  const outerRightIndex = html.indexOf("外右");
  const innerColsIndex = html.indexOf('<div class="penna-cols">', 1);
  expect(innerColsIndex).toBeLessThan(outerRightIndex);
});
