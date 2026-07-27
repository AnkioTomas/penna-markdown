import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("applies column and container css attrs as inline style", () => {
  const md = `::: cols gap=24px
@col max-width=200px
左列
@col
右列
:::`;
  const html = renderMarkdown(createEngine(), md);

  expect(html).toContain('<div class="penna-cols" style="gap:24px">');
  expect(html).toContain(
    '<div class="penna-cols__col" style="max-width:200px">',
  );
});
