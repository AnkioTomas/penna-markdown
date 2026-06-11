import { img } from "../../placeholder.js";

const shots = [
  { w: 400, h: 300, text: "海岸", bg: "0284c7" },
  { w: 300, h: 450, text: "竖图", bg: "7c3aed" },
  { w: 400, h: 280, text: "山景", bg: "059669" },
  { w: 360, h: 360, text: "人物", bg: "db2777" },
  { w: 420, h: 260, text: "建筑", bg: "d97706" },
  { w: 380, h: 320, text: "森林", bg: "15803d" },
];

const tiles = shots
  .map(({ w, h, text, bg }) => `![${text}](${img(w, h, text, { bg })})`)
  .join("\n\n");

/** @type {import('../syntaxExample.js').SyntaxExample} */
export default {
  name: "card-masonry",
  desc: "卡片瀑布流 :::: card-masonry",
  markdown: `:::: card-masonry cols="3" gap="16"

${tiles}

::::`,
};
