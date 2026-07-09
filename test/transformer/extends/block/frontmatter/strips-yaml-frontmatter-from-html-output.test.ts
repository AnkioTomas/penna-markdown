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

it("strips YAML frontmatter from HTML output", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), "---\ntitle: Hi\n---\n\nBody");
  expect(html).toBe("<p>Body</p>\n");
});
