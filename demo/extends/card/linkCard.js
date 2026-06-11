import { img } from "../../placeholder.js";

const icon = img(80, 80, "DOC", { bg: "2563eb" });

/** @type {import('../syntaxExample.js').SyntaxExample} */
export default {
  name: "link-card",
  desc: "链接卡片 ::: link-card",
  markdown: `::: link-card 文档 link="https://example.com" icon="${icon}"

点击整卡跳转到外部链接，左侧可显示 icon 图片。
:::`,
};
