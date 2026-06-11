/**
 * @file 块级语法拓展：卡片系列
 * @module transformer/extends/block/card
 */

import cardBlockParser from "./card.js";
import { linkCardBlockParser } from "./linkCard.js";
import { imageCardBlockParser } from "./imageCard.js";
import { repoCardBlockParser } from "./repoCard.js";
import { cardGridBlockParser } from "./cardGrid.js";
import { cardMasonryBlockParser } from "./cardMasonry.js";

/** 卡片扩展注册的全部块解析器（按优先级降序） */
export const cardBlockParsers = [
  cardMasonryBlockParser,
  cardGridBlockParser,
  repoCardBlockParser,
  imageCardBlockParser,
  linkCardBlockParser,
  cardBlockParser,
];

export {
  cardBlockParser,
  linkCardBlockParser,
  imageCardBlockParser,
  repoCardBlockParser,
  cardGridBlockParser,
  cardMasonryBlockParser,
};

export default cardBlockParser;
