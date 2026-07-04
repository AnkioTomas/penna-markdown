import type { SyntaxExample } from '../../syntax-example.js';
import { favicon, img } from "../../placeholder.js";

const icon = favicon("https://github.com");

const example = {
  name: "link-card",
  desc: "链接卡片 ::: link-card",
  markdown: `::: link-card 文档 link="https://example.com" icon="${icon}"

点击整卡跳转到外部链接，左侧可显示 icon 图片。
:::`,
} satisfies SyntaxExample;

export default example;
