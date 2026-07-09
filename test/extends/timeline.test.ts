import { describe, expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../helpers/engine.js";

describe("extends/timeline", () => {
  const engine = () => createEngine();

  const sample = `::: timeline
- [2025-03-20:success] 节点一
  正文内容

- [2025-02-21:warning] 节点二
  正文内容

- [2025-01-22:danger] 节点三
  正文内容
:::`;

  it("renders timeline items with title, time and type", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).toContain(
      '<div class="cherry-timeline cherry-timeline--placement-left">',
    );
    expect(html).toContain('<div class="cherry-timeline-box">');
    expect(html).toContain(
      '<div class="cherry-timeline-item cherry-timeline-item--success cherry-timeline-item--line-solid cherry-timeline-item--placement-left">',
    );
    expect(html).toContain(
      '<div class="cherry-timeline-item cherry-timeline-item--warning cherry-timeline-item--line-solid cherry-timeline-item--placement-left">',
    );
    expect(html).toContain(
      '<div class="cherry-timeline-item cherry-timeline-item--danger cherry-timeline-item--line-solid cherry-timeline-item--placement-left">',
    );
    expect(html).toContain('<p class="cherry-timeline-title">节点一</p>');
    expect(html).toContain('<p class="cherry-timeline-time">2025-03-20</p>');
    expect(html).toContain("<p>正文内容</p>");
    expect(html).not.toContain("vp-timeline");
  });

  it("supports multi-line content", () => {
    const md = `::: timeline
- [2025-03-20:success] 标题
  这是第一行正文

  这是第二行正文
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain('<p class="cherry-timeline-title">标题</p>');
    expect(html).toContain("<p>这是第一行正文</p>");
    expect(html).toContain("<p>这是第二行正文</p>");
  });

  it("supports container placement config", () => {
    const md = `::: timeline placement="right"
- [2025-03-20] 节点一
  正文内容
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain(
      'class="cherry-timeline cherry-timeline--placement-right"',
    );
  });

  it("supports line style config on container", () => {
    const md = `::: timeline line="dotted"
- [2025-03-20] 节点一
  正文内容
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain(
      'class="cherry-timeline cherry-timeline--placement-left"',
    );
    expect(html).toContain(
      '<div class="cherry-timeline-item cherry-timeline-item--info cherry-timeline-item--line-dotted cherry-timeline-item--placement-left">',
    );
  });

  it("does not render as generic container", () => {
    const html = renderMarkdown(engine(), sample);
    expect(html).not.toContain("cherry-alert--note");
  });

  it("renders task lists inside timeline item content", () => {
    const md = `::: timeline
- [2026-01-15:success] v0.1.0 首次发布
  - [x] GFM 完整支持
  - [x] Cherry 扩展语法
  - [ ] 编辑器完善

- [2026-06-01:tip] v0.2.0 计划中
  性能优化。
:::`;
    const html = renderMarkdown(engine(), md);
    expect(html).toContain(
      '<p class="cherry-timeline-title">v0.1.0 首次发布</p>',
    );
    expect(html).toContain(
      '<p class="cherry-timeline-title">v0.2.0 计划中</p>',
    );
    expect(html).not.toContain(
      '<p class="cherry-timeline-title">[x] GFM 完整支持</p>',
    );
    expect(html).toContain('<ul class="task-list">');
    expect(html).toContain('class="task-item done"');
    expect(html).toContain('class="task-item todo"');
    expect(html).toContain("GFM 完整支持");
    expect(html).toContain("编辑器完善");
  });
});
