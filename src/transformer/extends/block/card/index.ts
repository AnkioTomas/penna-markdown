/**
 * @file 块级语法拓展：卡片系列
 * @module transformer/extends/block/card
 */

import cardBlockParser from "@/transformer/extends/block/card/card";
import { linkCardBlockParser } from "@/transformer/extends/block/card/linkCard";
import { imageCardBlockParser } from "@/transformer/extends/block/card/imageCard";
import { repoCardBlockParser } from "@/transformer/extends/block/card/repoCard";
import { cardGridBlockParser } from "@/transformer/extends/block/card/cardGrid";
import { cardMasonryBlockParser } from "@/transformer/extends/block/card/cardMasonry";
import type { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import type { SyntaxMap } from "@/transformer/utils/syntaxMap.js";

/** 卡片扩展块级语法（priority 在表内定义） */
export const cardBlockSyntax: SyntaxMap<BaseBlockParser> = {
  96: cardMasonryBlockParser,
  95: cardGridBlockParser,
  94: repoCardBlockParser,
  93: imageCardBlockParser,
  92: linkCardBlockParser,
  91: cardBlockParser,
};

/** @deprecated 使用 cardBlockSyntax */
export const cardBlockParsers = Object.values(cardBlockSyntax);

export {
  cardBlockParser,
  linkCardBlockParser,
  imageCardBlockParser,
  repoCardBlockParser,
  cardGridBlockParser,
  cardMasonryBlockParser,
};

export default cardBlockParser;
