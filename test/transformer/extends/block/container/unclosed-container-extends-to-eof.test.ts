import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

// 未闭合 ::: 围栏与 fenced code / %%% 注释块一致：吞到 EOF 成块，
// 而非回退成散段落。这样增量解析能靠通用块边界定位整个围栏。
it("extends unclosed container to EOF instead of falling back to paragraphs", () => {
  const html = renderMarkdown(
    createEngine(),
    "before\n\n::: note 标题\n内容\n后续内容",
  );

  expect(html).toContain("<p>before</p>");
  expect(html).toContain("penna-alert");
  expect(html).toContain("内容");
  expect(html).toContain("后续内容");
  expect(html).not.toContain("::: note");
});
