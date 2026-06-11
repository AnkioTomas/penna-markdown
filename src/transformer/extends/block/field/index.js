/**
 * @file 块级语法拓展：字段系列
 * @module transformer/extends/block/field
 */

import { fieldBlockParser } from "./field.js";
import { fieldGroupBlockParser } from "./fieldGroup.js";

/** 字段扩展注册的全部块解析器（按优先级降序） */
export const fieldBlockParsers = [fieldGroupBlockParser, fieldBlockParser];

export { fieldBlockParser, fieldGroupBlockParser };
