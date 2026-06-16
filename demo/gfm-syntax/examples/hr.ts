import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "hr",
  desc: "分隔线 --- / *** / ___",
  markdown: `上文

---

星号分隔

* * *

下划线分隔

___`,
} satisfies SyntaxExample;

export default example;
