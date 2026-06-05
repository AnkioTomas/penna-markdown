/**
 * @file 解析 / 渲染上下文
 * @module transformer/core/ParserContext
 *
 * Store 在 TransformerEngine 构造时创建并注入各引擎；
 * Context 在引擎构造时创建一次，Parser 通过 ctx 访问 store 与协作方法。
 */

/**
 * 行内解析上下文（InlineParseEngine 持有）
 */
export class InlineParseContext {
  /**
   * @param {import('./InlineParser.js').InlineParseEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
  }

  get store() {
    return this._engine.store;
  }

  parseInline(text) {
    return this._engine.parse(text);
  }
}

/**
 * 渲染上下文（TransformerEngine 持有）
 */
export class RenderContext {
  /**
   * @param {import('../TransformerEngine.js').TransformerEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
  }

  get store() {
    return this._engine.store;
  }

  renderInline(nodes) {
    return this._engine._renderInline(nodes);
  }

  renderBlock(nodes) {
    return this._engine._renderBlocks(nodes);
  }
}
