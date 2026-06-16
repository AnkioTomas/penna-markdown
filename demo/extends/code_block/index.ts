import type { SyntaxExample } from '../syntax-example.js';
/** 增强围栏代码块演示（对应 code_block 扩展） */
const example = {
  name: "code_block",
  desc: "代码块 title / 行高亮 / 复制",
  markdown: `## 带标题

\`\`\`json title="package.json"
{
  "name": "vuepress-theme-plume"
}
\`\`\`

## 行高亮（VitePress 语法）

\`\`\`js{1,4,6-8}
export default { // Highlighted
  data () {
    return {
      msg: \`Highlighted!
      This line isn't highlighted,
      but this and the next 2 are.\`,
      motd: 'VitePress is awesome',
      lorem: 'ipsum'
    }
  }
}
\`\`\`

## 折叠代码块

\`\`\`css :collapsed-lines
html {
  margin: 0;
  background: black;
  height: 100%;
}

... more code
body {
  color: white;
}
\`\`\`

## 混合指定

\`\`\`bash {2,4-5}
#!/bin/sh
echo "line 2 highlighted"
echo "line 3 normal"
echo "line 4 highlighted"
echo "line 5 highlighted"
\`\`\`

## 仅语言标签

\`\`\`js
const hello = "world";
console.log(hello);
\`\`\``,
} satisfies SyntaxExample;

export default example;
