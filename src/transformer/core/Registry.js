/**
 * @file 语法注册表
 * @module transformer/core/Registry
 *
 * 集中管理所有块级 / 行内 Parser 实例：
 * - 构造时自动注册 GFM 内置语法（builtin.js）
 * - 支持运行时 register* / get* 查询
 * - 按 priority 降序缓存排序结果，避免每次 parse 都 sort
 *
 * 同一 type 默认不可重复注册；传入 `{ force: true }` 可覆盖（用于扩展内置语法）。
 */

import { builtinBlockSyntax, builtinInlineSyntax, applyGfmRegistryExtensions } from "@/transformer/gfm/builtin.js";

/**
 * @typedef {(
 *   nodes: import('./MarkdownNode.js').MarkdownNode[],
 *   frame: Record<string, unknown>,
 *   ctx: import('./ParserContext.js').InlineParseContext
 * ) => import('./MarkdownNode.js').MarkdownNode[] | void} InlineFinalizer
 */

export { BaseInlineParser, BaseBlockParser } from "@/transformer/core/ParserBase.js";

/**
 * 将 Map 中的 parser 按 priority 从高到低排序为数组。
 *
 * @param {Map<string, import('./ParserBase.js').BaseInlineParser | import('./ParserBase.js').BaseBlockParser>} map
 * @returns {Array}
 */
function sortByPriority(map) {
  return [...map.values()].sort((a, b) => b.priority - a.priority);
}

/**
 * Markdown 语法插件注册中心。
 */
export class Registry {
  constructor() {
    /** @type {Map<string, import('./ParserBase.js').BaseInlineParser>} */
    this.inlineParsers = new Map();
    /** @type {Map<string, import('./ParserBase.js').BaseBlockParser>} */
    this.blockParsers = new Map();
    /** @type {import('./Registry.js').InlineFinalizer[]} */
    this._inlineFinalizers = [];
    /** @type {{ inline: Array, block: Array } | null} 按 priority 排序后的缓存 */
    this._cache = null;

    for (const p of builtinInlineSyntax) this.registerInlineParser(p);
    for (const p of builtinBlockSyntax) this.registerBlockParser(p);
    applyGfmRegistryExtensions(this);
  }

  /** 注册表变更时失效排序缓存 */
  _touch() {
    this._cache = null;
  }

  /**
   * 通用注册逻辑：校验 type、处理冲突、写入 Map。
   *
   * @param {Map} map - inlineParsers 或 blockParsers
   * @param {Object} parser - 须含 type 字段的 parser 实例
   * @param {boolean} force - 为 true 时允许覆盖已存在的同 type 语法
   * @returns {Registry} 支持链式调用
   */
  _register(map, parser, force) {
    if (!parser?.type) throw new TypeError("parser 缺少 type");
    if (map.has(parser.type) && !force) {
      throw new Error(`语法 "${parser.type}" 已注册`);
    }
    map.set(parser.type, parser);
    this._touch();
    return this;
  }

  /**
   * 懒构建并返回排序后的 parser 列表缓存。
   *
   * @returns {{ inline: Array, block: Array }}
   */
  _cacheOrBuild() {
    if (!this._cache) {
      this._cache = {
        inline: sortByPriority(this.inlineParsers),
        block: sortByPriority(this.blockParsers),
      };
    }
    return this._cache;
  }

  /**
   * 注册行内语法插件。
   *
   * @param {import('./ParserBase.js').BaseInlineParser} parser
   * @param {{ force?: boolean }} [options]
   * @returns {Registry}
   */
  registerInlineParser(parser, { force } = {}) {
    return this._register(this.inlineParsers, parser, force);
  }

  /**
   * 注册块级语法插件。
   *
   * @param {import('./ParserBase.js').BaseBlockParser} parser
   * @param {{ force?: boolean }} [options]
   * @returns {Registry}
   */
  registerBlockParser(parser, { force } = {}) {
    return this._register(this.blockParsers, parser, force);
  }

  /**
   * 获取按 priority 降序排列的行内 parser 列表（解析调度顺序）。
   *
   * @returns {import('./ParserBase.js').BaseInlineParser[]}
   */
  getInlineParsers() {
    return this._cacheOrBuild().inline;
  }

  /**
   * 获取按 priority 降序排列的块级 parser 列表。
   *
   * @returns {import('./ParserBase.js').BaseBlockParser[]}
   */
  getBlockParsers() {
    return this._cacheOrBuild().block;
  }

  /**
   * 按 type 查找单个行内 parser（渲染阶段用于分发 render）。
   *
   * @param {string} type
   * @returns {import('./ParserBase.js').BaseInlineParser | undefined}
   */
  getInlineParser(type) {
    return this.inlineParsers.get(type);
  }

  /**
   * 按 type 查找单个块级 parser。
   *
   * @param {string} type
   * @returns {import('./ParserBase.js').BaseBlockParser | undefined}
   */
  getBlockParser(type) {
    return this.blockParsers.get(type);
  }

  /**
   * 注册行内解析结束后的后处理（扩展层使用，引擎不感知具体语义）
   *
   * @param {InlineFinalizer} fn
   * @returns {Registry}
   */
  registerInlineFinalizer(fn) {
    this._inlineFinalizers.push(fn);
    return this;
  }

  /** @returns {InlineFinalizer[]} */
  getInlineFinalizers() {
    return this._inlineFinalizers;
  }
}
