import { expect, it } from "vitest";
import {
  createEngine,
  createEnhancedEngine,
  renderMarkdown,
} from "../../../../helpers/engine.js";

const MD = `---
title: Hello World
author:
  name: Alice
tags:
  - docs
  - demo
---

# [[title]]

By [[author.name]], tags: [[tags]]

Unknown: [[missing]]

\`[[title]]\`
`;

it("creates invisible frontmatter ast node for incremental merge", () => {
  const engine = () => createEngine();
  const ast = engine().parse("---\ntitle: Hi\n---\n\nBody");
  const node = ast.children?.find((child) => child.type === "frontmatter");
  expect(node?.props?.invisible).toBe(true);
  expect(node?.props?.globalEffect).toBe(true);
  expect(node?.props?.parserStore).toEqual({ frontMatter: { title: "Hi" } });
  expect(node?.length).toBeGreaterThan(0);
});
