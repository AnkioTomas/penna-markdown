/**
 * @file Markdown 解析与 HTML 渲染引擎
 * @module transformer/TransformerEngine
 */

import {BlockParseEngine} from "@/transformer/core/BlockParser.js";
import {InlineParseEngine} from "@/transformer/core/InlineParser.js";



import {ParserStore} from "@/transformer/core/ParserStore.js";
import {Registry} from "@/transformer/core/Registry.js";
import {TransformerEngineOptions} from "@/transformer/TransformerEngineOptions";
import {RenderContext} from "@/transformer/core/context/RenderContext";
import {MarkdownNode} from "@/transformer/core/MarkdownNode";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";
import {IncrementalParseRange, IncrementalParseResult} from "@/transformer/core/Incremental/IncrementalParseRange";
import {IncrementalParser} from "@/transformer/core/Incremental/IncrementalParser";
/**
 * Markdown 解析与 HTML 渲染核心引擎。
 * 负责调度块级与行内解析器，构建 AST 树，并驱动 HTML 的增量及全量渲染。
 */
export class TransformerEngine {
    /** 语法注册表，保存已注册的全部 Block/Inline 解析器及其优先级 */
    readonly registry: Registry;
    /** 暗色主题状态，可由外部运行时更新后重新渲染 */
    isDark: boolean;

    /**
     * 初始化渲染引擎，完成内置 GFM 以及第三方自定义语法注册。
     * @param options 引擎的初始化配置项
     */
    constructor(options: TransformerEngineOptions = {}) {
        this.isDark = options.isDark ?? false;
        this.registry = new Registry();

        if (options.inlineParsers) {
            for (const [pri, parser] of Object.entries(options.inlineParsers)) {
                this.registry.registerInlineParser(parser, Number(pri));
            }
        }

        if (options.blockParsers) {
            for (const [pri, parser] of Object.entries(options.blockParsers)) {
                this.registry.registerBlockParser(parser, Number(pri));
            }
        }
        this.registry.clearParserOptions();
        this.registry.setOptions(options.syntaxOptions ?? {});
        this.registry.setRenderOptions(options.renderOptions ?? {});

    }


    /**
     * 对全文 Markdown 进行全量解析，构建完整的 MarkdownNode AST。
     * @param markdown 原始 Markdown 字符串
     * @returns 挂载了 ParserStore 状态的 root AST 节点
     */
    parse(markdown: string): MarkdownNode {
        const lines = normalizeMarkdownLines(markdown);
        const { blockParser } = this.createBlockParseEngine(lines);
        const ast = blockParser.parse(lines);
        ast.props = { store: blockParser.store };
        return ast;
    }

    /**
     * 增量解析。按 hash 边界定位变更区，局部 re-parse 后拼回 AST 并原地更新 `prevAst`。
     *
     * @param prevAst  上一次渲染保留的旧 AST 根节点（会被原地更新，对象引用不变）
     * @param markdown 变更区 markdown（支持 `string[]`）；空串/空数组表示删除
     * @param range    `prevHash` / `nextHash` 锚定未变块边界，见 {@link IncrementalParseRange}
     * @returns 操作类型与受影响节点（delete → 被删块；create/update → 新 parse 块）
     * @see IncrementalParser.parse
     */
    parseIncremental(
        prevAst: MarkdownNode,
        markdown: string | string[],
        range: IncrementalParseRange,
    ): IncrementalParseResult {
        let incrementalParser = new IncrementalParser(this.registry);
        return incrementalParser.parse(prevAst, markdown, range);
    }

    /**
     * 创建对应的块解析引擎实例，绑定内部 ParserStore 及 inline 编译器调用。
     * @param lines 当前需要解析的行数组
     */
    private createBlockParseEngine(lines: string[]): {
        blockParser: BlockParseEngine;
    } {
        const store = new ParserStore(lines);
        const inlineParser = new InlineParseEngine(this.registry, store);
        const blockParser = new BlockParseEngine(
            this.registry,
            store,
            (text) => inlineParser.parse(text),
        );
        return { blockParser };
    }

    /**
     * 创建对应的渲染上下文，挂载当前的共享存储并暴露单节点或批量子节点渲染方法。
     * @param store 解析共享存储
     * @returns 实现了 RenderContext 的渲染上下文实例
     */
    createRenderContext(store: ParserStore): RenderContext {
        const that = this;
        return new class implements RenderContext {
            store: ParserStore = store;
            isDark: boolean = that.isDark;

            renderInline(nodes?: MarkdownNode[]): string {
                return that._renderInline(nodes ?? [], this);
            }

            renderBlock(nodes?: MarkdownNode[]): string {
                return that._renderBlocks(nodes ?? [], this);
            }
        };
    }

    /**
     * 独立渲染单个 AST 块节点（通常用于增量局部 DOM 更新时重绘脏节点）。
     * @param node 需要渲染的目标 AST 节点
     * @param ast 整个文档的 AST 根节点，用于提取共享存储
     * @returns 渲染出来的单根 HTML 字符串
     */
    renderBlock(node: MarkdownNode, ast: MarkdownNode): string {
        const store = ast.props?.store as ParserStore | undefined;
        if (!store) return "";
        if (node.props?.invisible || node.type === "blank_line") return "";
        const ctx = this.createRenderContext(store);
        return this.registry.getBlockParser(node.type)?.render(node, ctx) ?? "";
    }

    /**
     * 全量渲染整个 Markdown AST 树，产生最终的完整 HTML 内容。
     * @param ast 整个文档的 AST 根节点
     * @returns 最终生成的完整 HTML 文本（自动追加尾部换行）
     */
    render(ast: MarkdownNode): string {

        const store = ast.props?.store;

        if (!store) return '';

        const ctx = this.createRenderContext(store as ParserStore);
        return  this._withTrailingNewline(this._renderBlocks(ast.children ?? [], ctx));
    }

    /**
     * 内部递归渲染一组行内 AST 子节点，支持在渲染当前节点时动态修改前一节点产生的 HTML。
     * @param nodes 行内子节点数组
     * @param ctx 渲染上下文
     * @returns 拼接后的行内 HTML 内容
     */
    _renderInline(nodes: MarkdownNode[], ctx: RenderContext): string {
        const results: string[] = [];

        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            let prevHtml = results.pop() ?? ''
            let prevHtmlObj = {html: prevHtml};
            const html = this.registry.getInlineParser(node.type)?.render(node, ctx, prevHtmlObj) ?? "";
            results.push(prevHtmlObj.html);
            results.push(html);
        }


        return results.join("");
    }

    /**
     * 内部递归渲染一组块级 AST 子节点，并使用换行符连接它们。
     * @param blocks 块级子节点数组
     * @param ctx 渲染上下文
     * @returns 拼接后的块级 HTML 文本
     */
    _renderBlocks(blocks: MarkdownNode[], ctx: RenderContext): string {
        const parts: string[] = [];
        for (const node of blocks) {
            if (node.props?.invisible || node.type === "blank_line") continue;
            const html = this.registry.getBlockParser(node.type)?.render(node, ctx) ?? "";
            if (html) parts.push(html);
        }
        return parts.join("\n");
    }

    /**
     * 格式化输出尾部换行符。
     * @param html HTML 内容
     */
    _withTrailingNewline(html: string): string {
        return html ? `${html}\n` : "";
    }
}