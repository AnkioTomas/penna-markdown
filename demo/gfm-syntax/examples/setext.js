/** @type {import('../../extends/syntaxExample.js').SyntaxExample} */
export default {
  name: "setext",
  desc: "Setext 标题（下划线式）",
  markdown: `一级标题
===

二级标题
---

与 ATX 标题可混用：

### ATX 三级

Setext 二级
----------`,
  expected: "",
};
