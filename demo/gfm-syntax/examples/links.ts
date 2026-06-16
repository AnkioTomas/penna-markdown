import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "links",
  desc: "行内链接 [text](url)",
  markdown: `[内联链接](https://example.com)

[带标题的链接](https://example.com "链接标题")

<https://example.com/path>

<user@example.com>`,
} satisfies SyntaxExample;

export default example;
