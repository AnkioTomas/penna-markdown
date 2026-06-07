/**
 * @file Markdown 解析与 HTML 渲染引擎
 * @module transformer/TransformerEngine
 *
 * 编排 Registry、BlockParser、InlineParser 与 RenderContext，
 * 提供 parse / render / stringify 统一入口。
 */

import { BlockParseEngine } from "@/transformer/core/BlockParser.js";
import { InlineParseEngine } from "@/transformer/core/InlineParser.js";
import { RenderContext } from "@/transformer/core/ParserContext.js";
import { ParserStore } from "@/transformer/core/ParserStore.js";
import { Registry } from "@/transformer/core/Registry.js";

/**
 * 规范化输入 Markdown：统一换行符并在末尾补 `\n`。
 *
 * @param {string} markdown
 * @returns {string}
 */
function normalizeMarkdown(markdown) {
    let text = String(markdown).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (!text.endsWith("\n")) text += "\n";
    return text;
}

/**
 * Cherry Markdown 转换引擎：Markdown ↔ AST ↔ HTML。
 */
export class TransformerEngine {
    /**
     * @param {Object} [options={}]
     * @param {import('@/transformer/core/ParserBase.js').BaseInlineParser[]} [options.inlineParsers]
     * @param {import('@/transformer/core/ParserBase.js').BaseBlockParser[]} [options.blockParsers]
     * @param {(payload: { type: 'inline'|'block', name: string, node: import('@/transformer/core/MarkdownNode.js').MarkdownNode }) => string|null|undefined} [options.beforeRender]
     * @param {(payload: { type: 'inline'|'block', name: string, node: import('@/transformer/core/MarkdownNode.js').MarkdownNode, html: string }) => string|null|undefined} [options.afterRender]
     */
    constructor(options = {}) {
        this.registry = new Registry();
        this.beforeRender = options.beforeRender;
        this.afterRender = options.afterRender;

        for (const p of options.inlineParsers ?? []) {
            this.registry.registerInlineParser(p, {force: true});
        }
        for (const p of options.blockParsers ?? []) {
            this.registry.registerBlockParser(p, {force: true});
        }
        this.store = new ParserStore();
        this.inlineParser = new InlineParseEngine({
            registry: this.registry,
            store: this.store,
        });
        this.blockParser = new BlockParseEngine({
            registry: this.registry,
            store: this.store,
            parseInline: (text) => this.inlineParser.parse(text),
        });
        this.renderCtx = new RenderContext(this);
    }

    /**
     * 将 Markdown 解析为 AST。
     *
     * @param {string} markdown
     * @returns {{ ast: import('@/transformer/core/MarkdownNode.js').MarkdownNode, source: string, errors: [] }}
     */
    parse(markdown) {
        const source = normalizeMarkdown(markdown);
        const lines = source.split("\n");
        if (lines.length > 0 && lines[lines.length - 1] === "") {
            lines.pop();
        }
        this.store.clear();
        const ast = this.blockParser.parse(lines);
        return {ast, source, errors: []};
    }

    /**
     * 将 Markdown 或 AST 渲染为 HTML。
     *
     * @param {string|import('@/transformer/core/MarkdownNode.js').MarkdownNode} input
     * @returns {{ html: string, meta: Object, errors: [] }}
     */
    render(input) {
        const markdown =
            typeof input === "string"
                ? input
                : input?.source ?? input?.raw ?? "";
        const ast =
            typeof input === "object" && input?.type === "root"
                ? input
                : this.parse(markdown).ast;
        return {html: this._withTrailingNewline(this._renderBlocks(ast.children ?? [])), meta: {}, errors: []};
    }

    /**
     * 将 AST 序列化回 Markdown（当前仅返回 source 字段）。
     *
     * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} ast
     * @returns {{ markdown: string, errors: [] }}
     */
    stringify(ast) {
        return {markdown: ast?.source ?? "", errors: []};
    }

    /**
     * 注册行内语法解析器。
     *
     * @param {import('@/transformer/core/ParserBase.js').BaseInlineParser} parser
     * @param {Object} [options]
     * @returns {this}
     */
    registerInlineParser(parser, options) {
        this.registry.registerInlineParser(parser, options);
        return this;
    }

    /**
     * 注册块级语法解析器。
     *
     * @param {import('@/transformer/core/ParserBase.js').BaseBlockParser} parser
     * @param {Object} [options]
     * @returns {this}
     */
    registerBlockParser(parser, options) {
        this.registry.registerBlockParser(parser, options);
        return this;
    }


    /**
     * 渲染前钩子：返回非 null 值则跳过默认 render。
     *
     * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} node
     * @returns {string|null|undefined}
     * @private
     */
    _hookBefore(node) {
        if (typeof this.beforeRender !== "function") {
            return null;
        }
        const kind = this.registry.getInlineParser(node.type) ? "inline" : "block";
        return this.beforeRender({type: kind, name: node.type, node});
    }

    /**
     * 渲染后钩子：可替换默认 HTML 输出。
     *
     * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} node
     * @param {string} html
     * @returns {string}
     * @private
     */
    _hookAfter(node, html) {
        if (typeof this.afterRender !== "function") {
            return html;
        }
        const kind = this.registry.getInlineParser(node.type) ? "inline" : "block";
        return this.afterRender({type: kind, name: node.type, node, html}) ?? html;
    }

    /**
     * 渲染行内节点数组。
     *
     * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes
     * @returns {string}
     * @private
     */
    _renderInline(nodes) {
        const ctx = this.renderCtx;

        return nodes
            .map((node) => {
                let html = this._hookBefore(node);
                if (html === null || html === undefined) {
                    const parser = this.registry.getInlineParser(node.type);
                    html = parser?.render?.(node, ctx) ?? "";
                }
                return this._hookAfter(node, html);
            })
            .join("");
    }

    /**
     * 渲染块级节点数组。
     *
     * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} blocks
     * @returns {string}
     * @private
     */
    _renderBlocks(blocks) {
        const ctx = this.renderCtx;

        const html = blocks
            .map((node) => {
                let out = this._hookBefore(node);
                if (out === null || out === undefined) {
                    const parser = this.registry.getBlockParser(node.type);
                    out = parser?.render?.(node, ctx) ?? "";
                }
                return this._hookAfter(node, out);
            })
            .join("\n");

        return html;
    }

    /**
     * 确保 HTML 输出以换行符结尾。
     *
     * @param {string} html
     * @returns {string}
     * @private
     */
    _withTrailingNewline(html) {
        return html ? `${html}\n` : "";
    }
}
