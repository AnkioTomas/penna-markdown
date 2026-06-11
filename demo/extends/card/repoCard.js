/** @type {import('../syntaxExample.js').SyntaxExample} */
export default {
  name: "repo-card",
  desc: "仓库卡片 ::: repo-card",
  markdown: `::: repo-card repo="vuepress/ecosystem" desc="Official plugins and themes for VuePress2" language="TypeScript"
:::

::: repo-card repo="vuepress/ecosystem" badges="false" stars="65" forks="88" license="MIT"
:::`,
  expected: "",
};
