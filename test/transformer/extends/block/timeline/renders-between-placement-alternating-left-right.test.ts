import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("alternates left/right for items under placement=between", () => {
  const md = `::: timeline placement="between"

- [2025-01] 第一项

- [2025-02] 第二项

- [2025-03] 第三项

:::`;
  const html = renderMarkdown(createEngine(), md);
  const placements = [
    ...html.matchAll(/penna-timeline-item--placement-(left|right)/g),
  ].map((m) => m[1]);

  expect(placements).toEqual(["left", "right", "left"]);
});

it("keeps all items left by default", () => {
  const md = `::: timeline

- [2025-01] A

- [2025-02] B

:::`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).not.toContain("penna-timeline-item--placement-right");
});
