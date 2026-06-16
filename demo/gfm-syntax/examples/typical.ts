import type { SyntaxExample } from '../../syntax-example.js';
import { img } from "../../placeholder.js";

const sampleImg = img(400, 200, "示例图片", { bg: "2563eb" });

const example = {
  name: "typical",
  desc: "典型语法：标题、强调、链接、列表、引用、代码、表格",
  markdown: `# 标题

段落与 **加粗**、*斜体*、~~删除线~~。

[链接](https://example.com) 与 ![图片](${sampleImg})

- 无序列表
- 第二项

1. 有序列表
2. 第二项

> 引用块

\`inline code\`

\`\`\`js
console.log('block')
\`\`\`

| 表头 | 值 |
| --- | --- |
| A | 1 |

---

自动链接 <https://example.com>
`,
} satisfies SyntaxExample;

export default example;
