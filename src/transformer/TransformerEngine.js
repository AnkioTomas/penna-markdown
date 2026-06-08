/**
 * @file Markdown 解析与 HTML 渲染引擎
 * @module transformer/TransformerEngine
 *
 * 编排 Registry、BlockParser、InlineParser，
 * 提供 parse / render / stringify 统一入口。
 */

import { BlockParseEngine } from "@/transformer/core/BlockParser.js";
import { InlineParseEngine } from "@/transformer/core/InlineParser.js";
import { createRenderContext } from "@/transformer/core/ParserContext.js";
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
     * @param {import('@/transformer/core/Registry.js').DocumentFinalizer[]} [options.documentFinalizers]
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
        for (const fn of options.documentFinalizers ?? []) {
            this.registry.registerDocumentFinalizer(fn);
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
        this.renderCtx = createRenderContext(this);
    }

    /**
     * @param {string} markdown
     * @returns {{ ast: import('@/transformer/core/MarkdownNode.js').MarkdownNode, source: string }}
     */
    parse(markdown) {
        const source = normalizeMarkdown(markdown);
        const lines = source.split("\n");
        if (lines.length > 0 && lines[lines.length - 1] === "") {
            lines.pop();
        }
        this.store.clear();
        const ast = this.blockParser.parse(lines);
        return {ast, source};
    }

    /**
     * @param {string|import('@/transformer/core/MarkdownNode.js').MarkdownNode} input
     * @returns {{ html: string, meta: Object }}
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
        return {html: this._withTrailingNewline(this._renderBlocks(ast.children ?? [])), meta: {}};
    }

    /**
     * @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode} ast
     * @returns {{ markdown: string }}
     */
    stringify(ast) {
        return {markdown: ast?.source ?? ""};
    }

    registerInlineParser(parser, options) {
        this.registry.registerInlineParser(parser, options);
        return this;
    }

    registerBlockParser(parser, options) {
        this.registry.registerBlockParser(parser, options);
        return this;
    }

    _nodeKind(type) {
        return this.registry.isInlineType(type) ? "inline" : "block";
    }

    _hookBefore(node) {
        if (typeof this.beforeRender !== "function") {
            return null;
        }
        return this.beforeRender({
            type: this._nodeKind(node.type),
            name: node.type,
            node,
        });
    }

    _hookAfter(node, html) {
        if (typeof this.afterRender !== "function") {
            return html;
        }
        return this.afterRender({
            type: this._nodeKind(node.type),
            name: node.type,
            node,
            html,
        }) ?? html;
    }

    _renderNode(node, ctx) {
        let html = this._hookBefore(node);
        if (html === null || html === undefined) {
            const renderer =
                this.registry.getInlineRenderer(node.type) ??
                this.registry.getBlockRenderer(node.type);
            html = renderer?.(node, ctx) ?? "";
        }
        return this._hookAfter(node, html);
    }

    _renderInline(nodes) {
        const ctx = this.renderCtx;
        return nodes.map((node) => this._renderNode(node, ctx)).join("");
    }

    _renderBlocks(blocks) {
        const ctx = this.renderCtx;
        return blocks.map((node) => this._renderNode(node, ctx)).join("\n");
    }

    _withTrailingNewline(html) {
        return html ? `${html}\n` : "";
    }
}
