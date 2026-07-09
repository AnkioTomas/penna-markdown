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

it("stores frontMatter in ParserStore", () => {
  const engine = () => createEngine();
  const ast = engine().parse("---\ntitle: Hi\n---\n\n# [[title]]");
  const store = ast.props?.store as { get(key: string): unknown } | undefined;
  expect(store?.get("frontMatter")).toEqual({ title: "Hi" });
});
