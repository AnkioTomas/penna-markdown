import { BlockParseEngine } from "@/transformer/core/BlockParser.js";
import { InlineParseEngine } from "@/transformer/core/InlineParser.js";
import { RenderContext } from "@/transformer/core/ParserContext.js";
import { ParserStore } from "@/transformer/core/ParserStore.js";
import { Registry } from "@/transformer/core/Registry.js";

function normalizeMarkdown(markdown) {
    let text = String(markdown).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (!text.endsWith("\n")) text += "\n";
    return text;
}

export class TransformerEngine {
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

    stringify(ast) {
        return {markdown: ast?.source ?? "", errors: []};
    }

    registerInlineParser(parser, options) {
        this.registry.registerInlineParser(parser, options);
        return this;
    }

    registerBlockParser(parser, options) {
        this.registry.registerBlockParser(parser, options);
        return this;
    }


    _hookBefore(node) {
        if (typeof this.beforeRender !== "function") {
            return null;
        }
        const kind = this.registry.getInlineParser(node.type) ? "inline" : "block";
        return this.beforeRender({type: kind, name: node.type, node});
    }

    _hookAfter(node, html) {
        if (typeof this.afterRender !== "function") {
            return html;
        }
        const kind = this.registry.getInlineParser(node.type) ? "inline" : "block";
        return this.afterRender({type: kind, name: node.type, node, html}) ?? html;
    }

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

    _withTrailingNewline(html) {
        return html ? `${html}\n` : "";
    }
}
