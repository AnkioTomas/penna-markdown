import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "entity",
  desc: "HTML 实体 &copy; &#169;",
  markdown: `&copy; 2026 Example Inc.

&#169; 数字实体

&frac12; 分数`,
} satisfies SyntaxExample;

export default example;
