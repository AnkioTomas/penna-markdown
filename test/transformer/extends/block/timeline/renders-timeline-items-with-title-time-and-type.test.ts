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

it("renders timeline items with title, time and type", () => {
  const engine = () => createEngine();
  const sample = `::: timeline
- [2025-03-20:success] 节点一
  正文内容

- [2025-02-21:warning] 节点二
  正文内容

- [2025-01-22:danger] 节点三
  正文内容
:::`;
  const html = renderMarkdown(createEngine(), sample);
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
