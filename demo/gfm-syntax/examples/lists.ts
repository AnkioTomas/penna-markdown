import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "lists",
  desc: "无序 / 有序 / 嵌套 / 松散与紧凑",
  markdown: `- 苹果
- 香蕉
- 橙子

1. 第一步
2. 第二步
3. 第三步

- 父项
  - 子项 A
  - 子项 B
    - 孙项

松散列表（项间空行）：

- 第一项

  中间段落属于上一项。

- 第二项`,
} satisfies SyntaxExample;

export default example;
