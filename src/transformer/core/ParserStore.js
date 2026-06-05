/**
 * @file 解析过程共享存储
 * @module transformer/core/ParserStore
 *
 * 在单次 parse 过程中，块级/行内 Parser 通过 BlockParseEngine / InlineParseEngine
 * 读写同一 Store 实例，用于跨语法传递状态（如链接引用定义）。
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
