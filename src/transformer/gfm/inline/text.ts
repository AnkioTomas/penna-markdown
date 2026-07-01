/**
 * @file 行内语法：纯文本兜底
 * @module transformer/gfm/inline/text
 *
 * priority 最低，逐字符消费未被其他行内语法匹配的输入。
 */

import {escapeText, parseBackslash} from "@/transformer/utils/escape.js";
import {BaseInlineParser} from "@/transformer/core/ParserBase.js";
import {createNode, MarkdownNode} from "@/transformer/core/MarkdownNode.js";
import {InlineParseContext} from "@/transformer/core/context/InlineParseContext";

/**
 * 纯文本行内解析器（兜底）。
 *
 * @extends {BaseInlineParser}
 */
class TextInlineParser extends BaseInlineParser {
    constructor() {
        super("text", false);
    }

    /** @inheritdoc */
    parse(src: string, index: number, ctx: InlineParseContext) {
        if (index >= src.length) return null;

        const chars: string[] = [];
        let i = index;
        for (; i < src.length;) {
            if (ctx.canOpenInlineAt(src, i)) {
                // 高优先级解析器已失败：把当前定界符当字面量吃掉，继续批量收集
                if (i === index) {
                    chars.push(src[i]);
                    i++;
                    continue;
                }
                break;
            }

            const escaped = parseBackslash(src, i);
            if (escaped) {
                chars.push(escaped.value);
                i = escaped.nextIndex;
                continue;
            }

            chars.push(src[i]);
            i++;
        }

        if (chars.length === 0) return null;

        return {
            node: createNode(this.type, i - index, chars.join("")),
            nextIndex: i,
        };
    }

    /** @inheritdoc */
    render(node: MarkdownNode) {
        return escapeText(node.value ?? "");
    }
}

export default new TextInlineParser();
