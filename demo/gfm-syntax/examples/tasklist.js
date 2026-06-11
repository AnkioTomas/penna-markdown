/** @type {import('../../extends/syntaxExample.js').SyntaxExample} */
export default {
  name: "tasklist",
  desc: "GFM 任务列表 - [ ] / - [x]",
  markdown: `## 基础任务

- [ ] 待办事项
- [x] 已完成
- [ ] 另一项待办

## 列表内混排

1. 第一步
2. [ ] 第二步（嵌套任务）
3. 第三步

> - [ ] 引用块内的任务
> - [x] 已完成`,
  expected: "",
};
