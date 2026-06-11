/** @type {import('../../extends/syntaxExample.js').SyntaxExample} */
export default {
  name: "code",
  desc: "行内代码、围栏块与缩进块",
  markdown: `行内 \`const x = 1\` 与 \`\`\`反引号\`\`\` 转义

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

多语言围栏：

\`\`\`bash
npm install cherry-markdown-next
\`\`\`

\`\`\`json
{ "name": "demo" }
\`\`\`

缩进代码块：

    const indented = true;
    console.log(indented);`,
};
