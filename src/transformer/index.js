/**
 * Transformer 子系统入口：Markdown 解析（AST）与 HTML 渲染。
 */

import { TransformerEngine } from "@/transformer/TransformerEngine.js";

export const CherryTransformer = TransformerEngine;

export function createTransformer(options = {}) {
  return new TransformerEngine(options);
}
