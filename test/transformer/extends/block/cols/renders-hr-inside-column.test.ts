import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("keeps hr semantics inside a column", () => {
  const md = `::: cols
@col
上段

---

下段
@col
右列
:::`;
  const html = renderMarkdown(createEngine(), md);

  expect(html).toContain("<hr />");
  expect(html).toContain("<p>上段</p>");
  expect(html).toContain("<p>下段</p>");
});
