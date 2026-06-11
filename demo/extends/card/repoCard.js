/** @type {import('../syntaxExample.js').SyntaxExample} */
export default {
  name: "repo-card",
  desc: "仓库卡片 ::: repo-card",
  markdown: `::: repo-card repo="vuepress/ecosystem"
Official plugins and themes for VuePress2
:::

描述写在卡片容器内。语言、Stars、Forks、License 均由 shields.io 根据 \`repo\` 自动拉取。`,
  expected: "",
};
