/**
 * @file 解析 / 渲染上下文类型与工厂
 * @module transformer/core/ParserContext
 *
 * Context 为 plain object，由引擎在构造时创建一次。
 */

/**
 * @typedef {Object} BlockParseContext
 * @property {import('./ParserStore.js').ParserStore} store
 * @property {import('./Registry.js').Registry} registry
 * @property {import('./MarkdownNode.js').MarkdownNode[] | undefined} prevNodes
 * @property {function(string): import('./MarkdownNode.js').MarkdownNode[]} parseInline
 * @property {function(string[]): import('./MarkdownNode.js').MarkdownNode[]} parseBlocks
 * @property {function(string[], number): boolean} checkInterrupt
 */

/**
 * @typedef {Object} InlineParseContext
 * @property {import('./ParserStore.js').ParserStore} store
 * @property {function(string): import('./MarkdownNode.js').MarkdownNode[]} parseInline
 */

/**
 * @typedef {Object} RenderContext
 * @property {import('./ParserStore.js').ParserStore} store
 * @property {function(import('./MarkdownNode.js').MarkdownNode[]): string} renderInline
 * @property {function(import('./MarkdownNode.js').MarkdownNode[]): string} renderBlock
 */

/**
 * @param {import('./BlockParser.js').BlockParseEngine} engine
 * @returns {BlockParseContext}
 */
export function createBlockParseContext(engine) {
  return {
    get store() {
      return engine.store;
    },
    get registry() {
      return engine.registry;
    },
    prevNodes: undefined,
    parseInline(text) {
      return engine.parseInline(text);
    },
    parseBlocks(lines) {
      return engine.parseBlocks(lines);
    },
    checkInterrupt(lines, index) {
      return engine.checkInterrupt(lines, index);
    },
  };
}

/**
 * @param {import('./InlineParser.js').InlineParseEngine} engine
 * @returns {InlineParseContext}
 */
export function createInlineParseContext(engine) {
  return {
    get store() {
      return engine.store;
    },
    parseInline(text) {
      return engine.parse(text);
    },
  };
}

/**
 * @param {import('../TransformerEngine.js').TransformerEngine} engine
 * @returns {RenderContext}
 */
export function createRenderContext(engine) {
  return {
    get store() {
      return engine.store;
    },
    renderInline(nodes) {
      return engine._renderInline(nodes);
    },
    renderBlock(nodes) {
      return engine._renderBlocks(nodes);
    },
  };
}
