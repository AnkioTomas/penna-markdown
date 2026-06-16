import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "table",
  desc: "GFM 表格 | col |",
  markdown: `| 左对齐 | 居中 | 右对齐 |
| :--- | :---: | ---: |
| A | B | C |
| 1 | 2 | 3 |

表格内可含 **粗体** 与 \`代码\`：

| 功能 | 语法 |
| --- | --- |
| 粗体 | \`**text**\` |
| 代码 | \`\`code\`\``,
} satisfies SyntaxExample;

export default example;
