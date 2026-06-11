/** @type {import('../../extends/syntaxExample.js').SyntaxExample} */
export default {
  name: "footnote",
  desc: "GFM 脚注 [^id] 与 [^id]: 定义",
  markdown: `带脚注的段落[^1]，以及第二次引用[^1]。

[^1]: 脚注正文，支持 **Markdown** 与换行。

第二段引用另一个脚注[^note]。

[^note]: 简短说明。`,
  expected: "",
};
