/**
 * @file Transformer 子系统入口
 * @module transformer/index
 *
 * 导出 Markdown 解析（AST）与 HTML 渲染引擎的工厂函数。
 */

import { TransformerEngine } from "@/transformer/TransformerEngine.js";

export {
  getAvailableExtensions,
  createExtensionParsers,
  createExtensionOptions,
  createTransformerWithExtensions,
} from "@/transformer/extends/extends.js";

/**
 * 创建 Transformer 引擎实例。
 *
 * @param {ConstructorParameters<typeof TransformerEngine>[0]} [options={}]
 * @returns {TransformerEngine}
 */
export function createTransformer(options = {}) {
  return new TransformerEngine(options);
}
