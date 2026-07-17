import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

it("coexists with frontmatter variables", () => {
  const md = `---
title: Front Title
---

# [[title]] and [必须]{.tip .top}`;
  const html = renderMarkdown(createEngine(), md);
  expect(html).toContain("Front Title");
  expect(html).toContain('<span class="penna-badge tip top">必须</span>');
});
