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

it("supports line style config on container", () => {
  const md = `::: timeline line="dotted"
- [2025-03-20] 节点一
  正文内容
:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain(
    'class="cherry-timeline cherry-timeline--placement-left"',
  );
  expect(html).toContain(
    '<div class="cherry-timeline-item cherry-timeline-item--info cherry-timeline-item--line-dotted cherry-timeline-item--placement-left">',
  );
});
