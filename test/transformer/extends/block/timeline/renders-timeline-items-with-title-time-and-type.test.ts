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
    '<div class="penna-timeline penna-timeline--placement-left">',
  );
  expect(html).toContain('<div class="penna-timeline-box">');
  expect(html).toContain(
    '<div class="penna-timeline-item penna-timeline-item--success penna-timeline-item--line-solid penna-timeline-item--placement-left">',
  );
  expect(html).toContain(
    '<div class="penna-timeline-item penna-timeline-item--warning penna-timeline-item--line-solid penna-timeline-item--placement-left">',
  );
  expect(html).toContain(
    '<div class="penna-timeline-item penna-timeline-item--danger penna-timeline-item--line-solid penna-timeline-item--placement-left">',
  );
  expect(html).toContain('<p class="penna-timeline-title">节点一</p>');
  expect(html).toContain('<p class="penna-timeline-time">2025-03-20</p>');
  expect(html).toContain("<p>正文内容</p>");
  expect(html).not.toContain("vp-timeline");
});
