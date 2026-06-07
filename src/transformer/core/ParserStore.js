/**
 * @file 解析过程共享存储
 * @module transformer/core/ParserStore
 *
 * 由 TransformerEngine 在构造时创建，并注入 BlockParseEngine / InlineParseEngine。
 * Parser 插件为单例，不在自身 constructor 中持有 store，而是通过上下文访问：
 *
 * - 块级 parse：`ctx.store`（BlockParseContext）
 * - 行内 parse：`ctx.store`（InlineParseContext）
 * - 渲染：`ctx.store`（RenderContext）
 */

export class ParserStore {
  constructor() {
    /** @type {Map<string, unknown>} */
    this._data = new Map();
    /** @type {Record<string, unknown>[]} 行内解析栈帧（引擎管理生命周期） */
    this._inlineFrames = [];
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
    this._inlineFrames = [];
  }

  /** 开始一次行内解析（支持嵌套压栈） */
  beginInlineFrame() {
    const frame = {};
    this._inlineFrames.push(frame);
    return frame;
  }

  /** @returns {Record<string, unknown> | null} */
  currentInlineFrame() {
    const n = this._inlineFrames.length;
    return n > 0 ? this._inlineFrames[n - 1] : null;
  }

  hasInlineFrame() {
    return this._inlineFrames.length > 0;
  }

  /**
   * 结束当前行内解析帧，依次执行 finalizer
   *
   * @param {import('./MarkdownNode.js').MarkdownNode[]} nodes
   * @param {import('./Registry.js').InlineFinalizer[]} finalizers
   * @param {import('./ParserContext.js').InlineParseContext} ctx
   */
  endInlineFrame(nodes, finalizers, ctx) {
    const frame = this._inlineFrames.pop();
    let result = nodes;
    if (frame) {
      for (const fn of finalizers) {
        result = fn(result, frame, ctx) ?? result;
      }
    }
    return result;
  }
}
