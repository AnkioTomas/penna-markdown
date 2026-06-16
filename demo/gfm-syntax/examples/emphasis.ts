import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "emphasis",
  desc: "强调 *斜体* **粗体** ***粗斜体***",
  markdown: `*斜体* 与 _另一种斜体_

**粗体** 与 __另一种粗体__

***粗斜体*** 与 ___另一种粗斜体___

嵌套：**粗体 *斜体* 粗体**`,
} satisfies SyntaxExample;

export default example;
