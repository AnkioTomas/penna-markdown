import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "card",
  desc: "基础卡片 ::: card",
  markdown: `::: card 标题

普通卡片内容，支持 **Markdown** 与列表。

- 要点一
- 要点二
:::`,
} satisfies SyntaxExample;

export default example;
