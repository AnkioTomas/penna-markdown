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


function normalizeMarkdown(markdown: string): string {
    let text = String(markdown).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (!text.endsWith("\n")) text += "\n";
    return text;
}

export class TransformerEngine {
    readonly registry: Registry;

    constructor(options: TransformerEngineOptions = {}) {
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
        if (options.syntaxOptions) {
            this.registry.setOptions(options.syntaxOptions);
        }
    }

    parse(markdown: string): MarkdownNode {
        const source = normalizeMarkdown(markdown);
        const lines = source.split("\n");
        if (lines.length > 0 && lines[lines.length - 1] === "") {
            lines.pop();
        }
        const store = new ParserStore(lines);

        const inlineParser = new InlineParseEngine(this.registry, store);
        const blockParser = new BlockParseEngine(this.registry, store, (text) => inlineParser.parse(text));

        const ast = blockParser.parse(lines);
        ast.props = {store};
        return ast;
    }

    render(ast: MarkdownNode): string {

        const store = ast.props?.store;

        if (!store) return '';

        const that = this;
        const ctx = new class implements RenderContext {
            store: ParserStore = store as ParserStore;

            renderInline(nodes?: MarkdownNode[]): string {
                return that._renderInline(nodes ?? [], ctx);
            }

            renderBlock(nodes?: MarkdownNode[]): string {
                return that._renderBlocks(nodes ?? [], ctx);
            }

        }
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
        return blocks.map((node) =>
            this.registry.getBlockParser(node.type)?.render(node, ctx) ?? ""
        ).join("\n");
    }

    _withTrailingNewline(html: string): string {
        return html ? `${html}\n` : "";
    }
}