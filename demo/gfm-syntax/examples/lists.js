/** @type {import('../../extends/syntaxExample.js').SyntaxExample} */
export default {
  name: "lists",
  desc: "无序 / 有序 / 嵌套列表",
  markdown: `- 苹果
- 香蕉
- 橙子

1. 第一步
2. 第二步
3. 第三步

- 父项
  - 子项 A
  - 子项 B
    - 孙项`,
  expected: "",
};
