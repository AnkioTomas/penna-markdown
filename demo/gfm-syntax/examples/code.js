/** @type {import('../../extends/syntaxExample.js').SyntaxExample} */
export default {
  name: "code",
  desc: "行内代码与围栏代码块",
  markdown: `行内 \`const x = 1\` 代码

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

缩进代码块：

    const indented = true;
    console.log(indented);`,
  expected: "",
};
