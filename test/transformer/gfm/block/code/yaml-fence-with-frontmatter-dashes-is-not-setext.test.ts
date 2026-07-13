import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

const MD = `\`\`\`yaml
---
title: Cherry 语法速览
subtitle: 完整演示 · 精简篇幅
author:
  name: Demo
  url: https://github.com
version: 0.1.0
tags: [demo, simple, gfm, cherry]
repo: https://github.com/AutoAccountingOrg/cherry-markdown-next
---

\`\`\`
`;

it("yaml fence with frontmatter dashes is not setext", () => {
  const engine = createEngine();
  const ast = engine.parse(MD);
  const types = (ast.children ?? []).map((n) => n.type);

  expect(types).not.toContain("setext_heading");
  expect(types).toContain("code");

  const code = (ast.children ?? []).find((n) => n.type === "code");
  expect(code?.props?.lang).toBe("yaml");
  expect(code?.value).toContain("title: Cherry 语法速览");
  expect(code?.value).toContain("---");

  const html = renderMarkdown(engine, MD);
  expect(html).toContain('class="language-yaml"');
  expect(html).not.toMatch(/<h2>/);
});
