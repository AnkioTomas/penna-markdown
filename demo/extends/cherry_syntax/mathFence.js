/** @type {import('../syntaxExample.js').SyntaxExample} */
export default {
  name: "math_fence",
  desc: "围栏公式 ```math / katex / latex",
  markdown: `围栏写法与 \`$$\` 块级公式等价，适合多行 LaTeX 源码。

## \`\`\`math

\`\`\`math
\\frac{a}{b} + \\sqrt{c^2 + d^2}
\`\`\`

## \`\`\`katex（别名）

\`\`\`katex
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
\`\`\`

## \`\`\`latex（别名）

\`\`\`latex
\\begin{aligned}
  E &= mc^2 \\\\
  F &= ma
\\end{aligned}
\`\`\`

## 对比：\`$$\` 语法

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

行内公式仍使用单个 \`$\`：$\\alpha + \\beta = \\gamma$`,
  expected: "",
};
