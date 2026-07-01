/**
 * @file 块级语法拓展：字段系列
 * @module transformer/extends/block/field
 */

import { fieldBlockParser } from "./field.js";
import { fieldGroupBlockParser } from "./fieldGroup.js";
import type { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import type { SyntaxMap } from "@/transformer/utils/syntaxMap.js";

/** 字段扩展块级语法（priority 在表内定义） */
export const fieldBlockSyntax: SyntaxMap<BaseBlockParser> = {
  82: fieldGroupBlockParser,
  90: fieldBlockParser,
};

/** @deprecated 使用 fieldBlockSyntax */
export const fieldBlockParsers = Object.values(fieldBlockSyntax);

export { fieldBlockParser, fieldGroupBlockParser };
