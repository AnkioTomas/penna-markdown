import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "repo-card",
  desc: "仓库卡片 ::: repo-card",
  markdown: `::: repo-card vuepress/ecosystem
Official plugins and themes for VuePress2
:::

开标签行直接写 \`owner/repo\`。描述写在卡片容器内，语言 / Stars / Forks / License 由 shields.io 自动拉取。`,
} satisfies SyntaxExample;

export default example;
