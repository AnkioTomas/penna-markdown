import { describe, expect, it } from "vitest";
import { createTransformer } from "@/transformer/index.js";
import { createTransformerWithExtensions } from "@/transformer/extends/extends.js";

describe("extends/timeline", () => {
  const engine = () => createTransformerWithExtensions(["timeline"]);

  const sample = `::: timeline
- 节点一
  time=2025-03-20 type=success

  正文内容

- 节点二
  time=2025-02-21 type=warning

  正文内容

- 节点三
  time=2025-01-22 type=danger

  正文内容
:::`;

  it("renders timeline items with title, time and type", () => {
    const { html } = engine().render(sample);
    expect(html).toContain('<div class="cherry-timeline placement-left">');
    expect(html).toContain('<div class="cherry-timeline-box">');
    expect(html).toContain(
      '<div class="cherry-timeline-item success line-solid placement-left">',
    );
    expect(html).toContain(
      '<div class="cherry-timeline-item warning line-solid placement-left">',
    );
    expect(html).toContain(
      '<div class="cherry-timeline-item danger line-solid placement-left">',
    );
    expect(html).toContain('<p class="cherry-timeline-title">节点一</p>');
    expect(html).toContain('<p class="cherry-timeline-time">2025-03-20</p>');
    expect(html).toContain("<p>正文内容</p>");
    expect(html).not.toContain("vp-timeline");
  });

  it("supports multi-line title before config line", () => {
    const md = `::: timeline
- 标题
  也是标题
  time=2025-03-20 type=success

  正文内容
:::`;
    const { html } = engine().render(md);
    expect(html).toContain(
      '<p class="cherry-timeline-title">标题<br>也是标题</p>',
    );
  });

  it("supports container placement config", () => {
    const md = `::: timeline placement="right"
- 节点一
  time=2025-03-20

  正文内容
:::`;
    const { html } = engine().render(md);
    expect(html).toContain('class="cherry-timeline placement-right"');
  });

  it("supports between placement with item placement", () => {
    const md = `::: timeline placement="between"
- 节点一
  time=2025-03-20 placement=right

  正文内容
:::`;
    const { html } = engine().render(md);
    expect(html).toContain('class="cherry-timeline placement-between"');
    expect(html).toContain(
      '<div class="cherry-timeline-item info line-solid placement-right">',
    );
  });

  it("supports line style config", () => {
    const md = `::: timeline line="dotted"
- 节点一
  time=2025-03-20 line=dashed

  正文内容
:::`;
    const { html } = engine().render(md);
    expect(html).toContain('class="cherry-timeline placement-left"');
    expect(html).toContain(
      '<div class="cherry-timeline-item info line-dashed placement-left">',
    );
  });

  it("supports custom item color", () => {
    const md = `::: timeline
- 节点一
  time=2025-03-20 color=#3cf

  正文内容
:::`;
    const { html } = engine().render(md);
    expect(html).toContain("--cherry-timeline-c-line: #3cf");
    expect(html).toContain("--cherry-timeline-c-point: #3cf");
  });

  it("does not render as generic container", () => {
    const { html } = engine().render(sample);
    expect(html).not.toContain('class="alert note"');
  });

  it("is disabled without extension", () => {
    const { html } = createTransformer().render(sample);
    expect(html).not.toContain("cherry-timeline");
    expect(html).toContain("节点一");
  });
});
