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

it("does not resolve variables inside inline code", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    "---\nversion: 0.1.0\n---\n\n`[[version]]`\n",
  );
  expect(html).toBe("<p><code>[[version]]</code></p>\n");
});
