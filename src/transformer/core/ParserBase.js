/**
 * @file 语法解析器基类
 * @module transformer/core/ParserBase
 *
 * Transformer 采用「插件式语法」架构：每种 Markdown 语法（标题、段落、加粗等）
 * 都是一个独立的 Parser 实例，通过 Registry 注册并按 priority 排序调度。
 *
 * 子类只需实现 parse / render，不必关心遍历与调度逻辑。
 */

/**
 * 行内语法解析器基类。
 *
 * 行内解析在**单段字符串**上进行，从左到右扫描 index，每次由 Registry
 * 中 priority 最高的匹配器「抢占」一段输入。典型子类：text、emphasis、autolink。
 *
 * @abstract
 */
export class BaseInlineParser {
  /**
   * @param {Object} options
   * @param {string} options.type - 语法唯一标识，与 AST 节点 type 及 Registry 键一致
   * @param {number} [options.priority=0] - 匹配优先级，数值越大越先尝试
   */
  constructor({ type, priority = 0 } = {}) {
    this.type = type;
    this.priority = priority;
  }

  /**
   * 从 src[index] 起尝试匹配当前语法。
   *
   * @param {string} src
   * @param {number} index
   * @param {import('./ParserContext.js').InlineParseContext} ctx -
   *   行内解析上下文（含 store、parseInline）
   * @returns {{
   *   node: import('./MarkdownNode.js').MarkdownNode,
   *   nextIndex: number
   * } | null}
   */
  parse(src, index, ctx) {
    return null;
  }

  /**
   * @param {import('./MarkdownNode.js').MarkdownNode} node
   * @param {import('./ParserContext.js').RenderContext} ctx -
   *   渲染上下文（含 store、renderInline）
   * @returns {string}
   */
  render(node, ctx) {
    return "";
  }
}

/**
 * 块级语法解析器基类。
 *
 * @abstract
 */
export class BaseBlockParser {
  /**
   * @param {Object} options
   * @param {string} options.type
   * @param {number} [options.priority=0]
   * @param {boolean} [options.canInterruptParagraph=true]
   */
  constructor({ type, priority = 0, canInterruptParagraph = true } = {}) {
    this.type = type;
    this.priority = priority;
    this.canInterruptParagraph = canInterruptParagraph;
  }

  /**
   * @param {string[]} lines
   * @param {number} index
   * @param {import('./ParserContext.js').BlockParseContext} ctx -
   *   块级解析上下文（含 store、parseInline、parseBlocks、checkInterrupt、prevNodes）
   * @returns {{
   *   node: import('./MarkdownNode.js').MarkdownNode,
   *   nextIndex: number,
   *   replaceLast?: boolean
   * } | null}
   */
  parse(lines, index, ctx) {
    return null;
  }

  /**
   * @param {import('./MarkdownNode.js').MarkdownNode} node
   * @param {import('./ParserContext.js').RenderContext} ctx -
   *   渲染上下文（含 store、renderInline、renderBlock）
   * @returns {string}
   */
  render(node, ctx) {
    return "";
  }
}
