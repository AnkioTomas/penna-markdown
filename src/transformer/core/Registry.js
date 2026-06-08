/**
 * @file 语法注册表
 * @module transformer/core/Registry
 *
 * 集中管理块级 / 行内 Parser 与 Renderer：
 * - 构造时自动注册 GFM 内置语法（builtin.js）
 * - 解析与渲染分发解耦（renderer 独立注册）
 */

import { builtinBlockSyntax, builtinInlineSyntax, applyGfmRegistryExtensions } from "@/transformer/gfm/builtin.js";

/**
 * @typedef {(
 *   nodes: import('./MarkdownNode.js').MarkdownNode[],
 *   frame: Record<string, unknown>,
 *   ctx: import('./ParserContext.js').InlineParseContext
 * ) => import('./MarkdownNode.js').MarkdownNode[] | void} InlineFinalizer
 */

/**
 * @typedef {(
 *   root: import('./MarkdownNode.js').MarkdownNode,
 *   ctx: import('./ParserContext.js').BlockParseContext
 * ) => import('./MarkdownNode.js').MarkdownNode | void} DocumentFinalizer
 */

/**
 * @typedef {(
 *   node: import('./MarkdownNode.js').MarkdownNode,
 *   ctx: import('./ParserContext.js').RenderContext
 * ) => string} NodeRenderer
 */

/**
 * Markdown 语法插件注册中心。
 */
export class Registry {
  constructor() {
    /** @type {Map<string, import('./ParserBase.js').BaseInlineParser>} */
    this.inlineParsers = new Map();
    /** @type {Map<string, import('./ParserBase.js').BaseBlockParser>} */
    this.blockParsers = new Map();
    /** @type {Map<string, NodeRenderer>} */
    this.inlineRenderers = new Map();
    /** @type {Map<string, NodeRenderer>} */
    this.blockRenderers = new Map();
    /** @type {InlineFinalizer[]} */
    this._inlineFinalizers = [];
    /** @type {DocumentFinalizer[]} */
    this._documentFinalizers = [];
    /** @type {{ inline: Array, block: Array } | null} */
    this._cache = null;

    for (const p of builtinInlineSyntax) this.registerInlineParser(p);
    for (const p of builtinBlockSyntax) this.registerBlockParser(p);
    applyGfmRegistryExtensions(this);
  }

  _touch() {
    this._cache = null;
  }

  /**
   * @param {Map} map
   * @param {Map<string, NodeRenderer>} renderers
   * @param {Object} parser
   * @param {boolean} force
   */
  _register(map, renderers, parser, force) {
    if (!parser?.type) throw new TypeError("parser 缺少 type");
    if (map.has(parser.type) && !force) {
      throw new Error(`语法 "${parser.type}" 已注册`);
    }
    map.set(parser.type, parser);
    if (typeof parser.render === "function") {
      renderers.set(parser.type, (node, ctx) => parser.render(node, ctx));
    }
    this._touch();
  }

  _cacheOrBuild() {
    if (!this._cache) {
      const byPriority = (map) =>
        [...map.values()].sort((a, b) => b.priority - a.priority);
      this._cache = {
        inline: byPriority(this.inlineParsers),
        block: byPriority(this.blockParsers),
      };
    }
    return this._cache;
  }

  registerInlineParser(parser, { force } = {}) {
    this._register(this.inlineParsers, this.inlineRenderers, parser, force);
  }

  registerBlockParser(parser, { force } = {}) {
    this._register(this.blockParsers, this.blockRenderers, parser, force);
  }

  /**
   * @param {string} type
   * @param {NodeRenderer} fn
   */
  registerInlineRenderer(type, fn) {
    this.inlineRenderers.set(type, fn);
  }

  /**
   * @param {string} type
   * @param {NodeRenderer} fn
   */
  registerBlockRenderer(type, fn) {
    this.blockRenderers.set(type, fn);
  }

  getInlineParsers() {
    return this._cacheOrBuild().inline;
  }

  getBlockParsers() {
    return this._cacheOrBuild().block;
  }

  getInlineParser(type) {
    return this.inlineParsers.get(type);
  }

  getBlockParser(type) {
    return this.blockParsers.get(type);
  }

  /** @param {string} type */
  getInlineRenderer(type) {
    return this.inlineRenderers.get(type);
  }

  /** @param {string} type */
  getBlockRenderer(type) {
    return this.blockRenderers.get(type);
  }

  isInlineType(type) {
    return this.inlineParsers.has(type) || this.inlineRenderers.has(type);
  }

  isBlockType(type) {
    return this.blockParsers.has(type) || this.blockRenderers.has(type);
  }

  registerInlineFinalizer(fn) {
    this._inlineFinalizers.push(fn);
  }

  getInlineFinalizers() {
    return this._inlineFinalizers;
  }

  registerDocumentFinalizer(fn) {
    this._documentFinalizers.push(fn);
  }

  getDocumentFinalizers() {
    return this._documentFinalizers;
  }
}
