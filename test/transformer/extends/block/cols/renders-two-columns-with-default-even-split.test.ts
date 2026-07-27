import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("renders two columns with default even split", () => {
  const md = `::: cols
@col
左列
@col
右列
:::`;
  const html = renderMarkdown(createEngine(), md);

  expect(html).toContain('<div class="penna-cols">');
  expect((html.match(/<div class="penna-cols__col">/g) ?? []).length).toBe(2);
  expect(html).toContain("<p>左列</p>");
  expect(html).toContain("<p>右列</p>");
});
