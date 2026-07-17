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

it("renders task lists inside timeline item content", () => {
  const md = `::: timeline
- [2026-01-15:success] v0.1.0 首次发布
  - [x] GFM 完整支持
  - [x] Penna 扩展语法
  - [ ] 编辑器完善

- [2026-06-01:tip] v0.2.0 计划中
  性能优化。
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain('<p class="penna-timeline-title">v0.1.0 首次发布</p>');
  expect(html).toContain('<p class="penna-timeline-title">v0.2.0 计划中</p>');
  expect(html).not.toContain(
    '<p class="penna-timeline-title">[x] GFM 完整支持</p>',
  );
  expect(html).toContain('<ul class="task-list">');
  expect(html).toContain('class="task-item done"');
  expect(html).toContain('class="task-item todo"');
  expect(html).toContain("GFM 完整支持");
  expect(html).toContain("编辑器完善");
});
