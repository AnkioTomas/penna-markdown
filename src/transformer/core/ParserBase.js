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
   * 匹配成功时返回 `{ node, nextIndex }`，由 InlineParseEngine 推进游标；
   * 不匹配则返回 null，引擎继续尝试下一个 parser。
   *
   * @param {string} src - 待解析的整段行内文本
   * @param {number} index - 当前扫描位置（字符下标）
   * @param {function(string): import('./MarkdownNode.js').MarkdownNode[]} parseInline -
   *   递归解析子串的回调，用于嵌套语法（如 `**a *b* c**` 的内部）；
   *   共享存储通过 `parseInline.store` 访问
   * @returns {{
   *   node: import('./MarkdownNode.js').MarkdownNode,
   *   nextIndex: number
   * } | null}
   */
  parse(src, index, parseInline) {
    return null;
  }

  /**
   * 将行内 AST 节点渲染为 HTML 片段（不含外层块级标签）。
   *
   * @param {import('./MarkdownNode.js').MarkdownNode} node - 本 type 对应的 AST 节点
   * @param {function(import('./MarkdownNode.js').MarkdownNode[]): string} renderInline -
   *   渲染子节点列表的回调；共享存储通过 `renderInline.store` 访问
   * @returns {string}
   */
  render(node, renderInline) {
    return "";
  }
}

/**
 * 块级语法解析器基类。
 *
 * 块级解析在**按行切分的数组**上进行，每次从 index 行起尝试匹配一个块
 * （可能跨多行，如引用、段落）。典型子类：heading、blockquote、paragraph。
 *
 * @abstract
 */
export class BaseBlockParser {
  /**
   * @param {Object} options
   * @param {string} options.type - 语法唯一标识
   * @param {number} [options.priority=0] - 匹配优先级，数值越大越先尝试
   * @param {boolean} [options.canInterruptParagraph=true] - 是否可以中断段落
   */
  constructor({ type, priority = 0, canInterruptParagraph = true } = {}) {
    this.type = type;
    this.priority = priority;
    this.canInterruptParagraph = canInterruptParagraph;
  }

  /**
   * 从 lines[index] 起尝试解析一个块级节点。
   *
   * 可通过 blockParser.parseInline() 将块内文本交给行内引擎；
   * 需要嵌套块时（如引用内的子块）可再次调用 blockParser 相关能力。
   *
   * @param {string[]} lines - 全文按换行符拆分后的行数组（不含 \r）
   * @param {number} index - 当前行下标
   * @param {import('./BlockParser.js').BlockParseEngine} blockParser -
   *   块级引擎实例，提供 parseInline 等协作方法；
   *   共享存储通过 `blockParser.store` 访问
   * @param {import('./MarkdownNode.js').MarkdownNode[]} [prevNodes] -
   *   当前已解析完成的块级节点列表，用于「后瞻」逻辑（如 Setext 标题）
   * @returns {{
   *   node: import('./MarkdownNode.js').MarkdownNode,
   *   nextIndex: number,
   *   replaceLast?: boolean
   * } | null}
   */
   parse(lines, index, blockParser, prevNodes) {
    return null;
   }

  /**
   * 将块级 AST 节点渲染为 HTML。
   *
   * @param {import('./MarkdownNode.js').MarkdownNode} node
   * @param {function(import('./MarkdownNode.js').MarkdownNode[]): string} renderInline -
   *   渲染节点内行内子树；共享存储通过 `renderInline.store` 访问
   * @param {function(import('./MarkdownNode.js').MarkdownNode[]): string} renderBlock -
   *   渲染块级子树（用于含嵌套块的语法）；共享存储通过 `renderBlock.store` 访问
   * @returns {string}
   */
  render(node, renderInline, renderBlock) {
    return "";
  }
}
