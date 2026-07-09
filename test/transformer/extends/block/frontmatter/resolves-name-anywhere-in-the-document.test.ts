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

it("resolves [[name]] anywhere in the document", () => {
  const engine = () => createEngine();
  const html = renderMarkdown(createEngine(), MD);
  expect(html).toContain("<h1>Hello World</h1>");
  expect(html).toContain("By Alice, tags:");
  expect(html).toContain("docs, demo");
  expect(html).not.toContain("[&quot;docs&quot;");
  expect(html).toContain("<p>Unknown: [[missing]]</p>");
  expect(html).toContain("<code>[[title]]</code>");
});
