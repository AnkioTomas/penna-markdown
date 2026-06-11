/** @type {import('../../extends/syntaxExample.js').SyntaxExample} */
export default {
  name: "link_reference",
  desc: "链接引用定义 [ref]: url",
  markdown: `[示例链接][demo]

[另一个][other]

[demo]: https://example.com/demo "演示"
[other]: https://example.com/other`,
  expected: "",
};
