/**
 * @file 解析过程共享存储
 * @module transformer/core/ParserStore
 *
 * 由 TransformerEngine 在构造时创建，并注入 BlockParseEngine / InlineParseEngine。
 * Parser 插件为单例，不在自身 constructor 中持有 store，而是通过已有上下文访问：
 *
 * - 块级：`blockParser.store`
 * - 行内：`parseInline.store`
 * - 渲染：`renderInline.store` / `renderBlock.store`
 */

export class ParserStore {
  constructor() {
    /** @type {Map<string, unknown>} */
    this._data = new Map();
  }

  get(key) {
    return this._data.get(key);
  }

  set(key, value) {
    this._data.set(key, value);
    return this;
  }

  has(key) {
    return this._data.has(key);
  }

  delete(key) {
    return this._data.delete(key);
  }

  clear() {
    this._data.clear();
  }
}
