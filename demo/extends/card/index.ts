import type { SyntaxExample } from "../../syntax-example.js";
import card from "./card.js";
import linkCard from "./linkCard.js";
import imageCard from "./imageCard.js";
import repoCard from "./repoCard.js";
import cardGrid from "./cardGrid.js";
import cardMasonry from "./cardMasonry.js";

/** 卡片系列演示（与 block/card 子模块一一对应） */
export const cardExamples: SyntaxExample[] = [
  card,
  linkCard,
  imageCard,
  repoCard,
  cardGrid,
  cardMasonry,
];
