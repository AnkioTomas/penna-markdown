import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const engine = () => createEngine();

const sample = `::: timeline
- [2025-03-20:success] 节点一
  正文内容

- [2025-02-21:warning] 节点二
  正文内容

- [2025-01-22:danger] 节点三
  正文内容
:::`;

it("supports multi-line content", () => {
  const md = `::: timeline
- [2025-03-20:success] 标题
  这是第一行正文

  这是第二行正文
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('<p class="penna-timeline-title">标题</p>');
  expect(html).toContain("<p>这是第一行正文</p>");
  expect(html).toContain("<p>这是第二行正文</p>");
});
