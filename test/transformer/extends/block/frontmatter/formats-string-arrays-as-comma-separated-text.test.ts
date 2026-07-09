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

it("formats string arrays as comma-separated text", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(
    engine(),
    `---
tags:
  - markdown
  - gfm
---
[[tags]]`,
  );
  expect(html).toBe("<p>markdown, gfm</p>\n");
});
