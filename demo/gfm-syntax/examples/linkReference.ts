import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "link_reference",
  desc: "链接引用定义 [ref]: url",
  markdown: `[示例链接][demo]

[另一个][other]

[demo]: https://example.com/demo "演示"
[other]: https://example.com/other`,
} satisfies SyntaxExample;

export default example;
