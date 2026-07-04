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
export class TransformerEngine {
    readonly registry: Registry;
    /** 暗色主题，可由外部在运行时更新后重新 render。 */
    isDark: boolean;

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

    parse(markdown: string): MarkdownNode {
        const lines = normalizeMarkdownLines(markdown);
        const store = new ParserStore(lines);

        const inlineParser = new InlineParseEngine(this.registry, store);
        const blockParser = new BlockParseEngine(this.registry, store, (text) => inlineParser.parse(text));

        const ast = blockParser.parse(lines);
        ast.props = {store};
        return ast;
    }

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

    renderBlock(node: MarkdownNode, ast: MarkdownNode): string {
        const store = ast.props?.store as ParserStore | undefined;
        if (!store) return "";
        if (node.props?.invisible || node.type === "blank_line") return "";
        const ctx = this.createRenderContext(store);
        return this.registry.getBlockParser(node.type)?.render(node, ctx) ?? "";
    }

    render(ast: MarkdownNode): string {

        const store = ast.props?.store;

        if (!store) return '';

        const ctx = this.createRenderContext(store as ParserStore);
        return  this._withTrailingNewline(this._renderBlocks(ast.children ?? [], ctx));
    }

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


    _renderBlocks(blocks: MarkdownNode[], ctx: RenderContext): string {
        const parts: string[] = [];
        for (const node of blocks) {
            if (node.props?.invisible || node.type === "blank_line") continue;
            const html = this.registry.getBlockParser(node.type)?.render(node, ctx) ?? "";
            if (html) parts.push(html);
        }
        return parts.join("\n");
    }

    _withTrailingNewline(html: string): string {
        return html ? `${html}\n` : "";
    }
}