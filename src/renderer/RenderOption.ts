import {Theme} from "@/theme/Theme";
import {BaseBlockParser, BaseInlineParser} from "@/transformer/core/ParserBase";

export interface RenderOption {
    mount: HTMLElement;
    theme: Theme;
    inlineParsers?: Record<number, BaseInlineParser>;
    blockParsers?: Record<number, BaseBlockParser>;
}
