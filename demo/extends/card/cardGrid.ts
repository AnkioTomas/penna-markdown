import type { SyntaxExample } from '../../syntax-example.js';
import { img } from "../../placeholder.js";

const gridImg = img(400, 240, "网格图片", { bg: "7c3aed" });

const example = {
  name: "card-grid",
  desc: "卡片网格 :::: card-grid",
  markdown: `:::: card-grid cols="{ sm: 1, md: 2, lg: 2 }"

::: link-card 指南 link="https://example.com/guide"

快速上手文档。
:::

::: image-card image="${gridImg}" title="示例图片" author="Alice"

网格中的图片卡片。
:::

::: card 说明

网格中的普通卡片。
:::

::::`,
} satisfies SyntaxExample;

export default example;
