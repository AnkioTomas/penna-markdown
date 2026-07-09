import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("formats boolean and number frontmatter vars", () => {
  const md = `---
enabled: true
count: 3
---

enabled=[[enabled]], count=[[count]]
`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain("<p>enabled=true, count=3</p>");
});
