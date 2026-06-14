/**
 * @file 行内语法：加粗
 * @module transformer/gfm/inline/strong
 *
 * 加粗 **text** / __text__。
 * 采用堆栈思路解决同级嵌套造成的提前闭合问题（渲染黑洞）。
 */

import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode, MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { isDelimiterWhitespace } from "@/transformer/utils/normalize.js";

const isAlphanumeric = (char: string) => /[A-Za-z0-9]/.test(char);

class StrongInlineParser extends BaseInlineParser {
    constructor() {
    // 须高于 emphasis，确保 ** 优先被此解析器捕获
        super("strong");
    }

    /** @inheritdoc */
    parse(src: string, index: number, ctx: any) {
        const marker = src[index];
        if (marker !== '*' && marker !== '_') return null;

        // 1. 确认是双字符起步
        if (src[index + 1] !== marker) return null;

        // 2. 校验起始符有效性
        const nextChar = src[index + 2] || '';
        if (isDelimiterWhitespace(nextChar)) return null;

        // GFM 规范：下划线 `_` 不能在词语内部触发
        if (marker === '_') {
            const prevChar = index > 0 ? src[index - 1] : '';
            if (isAlphanumeric(prevChar)) return null;
        }

        // 3. 堆栈预读寻找闭合符
        // stack 用于记录遇到的有效“内层”起始符，防止匹配到嵌套的内部标签而提前结束
        const stack: number[] = [];
        let j = index + 2;
        let foundCloser = false;
        let closerIndex = -1;

        while (j < src.length) {
            // 完美跳过转义符
            if (src[j] === '\\' && j + 1 < src.length) {
                j += 2;
                continue;
            }

            if (src[j] === marker && src[j + 1] === marker) {
                const prevChar = src[j - 1] || '';
                const charAfter = src[j + 2] || '';

                let isValidCloser = !isDelimiterWhitespace(prevChar);
                let isValidOpener = !isDelimiterWhitespace(charAfter);

                // 下划线 `_` 的词内限制
                if (marker === '_') {
                    if (isValidCloser && isAlphanumeric(charAfter)) isValidCloser = false;
                    if (isValidOpener && isAlphanumeric(prevChar)) isValidOpener = false;
                }

                // 🌟 核心：堆栈匹配逻辑
                if (isValidCloser) {
                    if (stack.length > 0) {
                        stack.pop(); // 匹配到一个内层加粗，抵消
                        j += 2;
                        continue;
                    } else {
                        foundCloser = true; // 堆栈为空且遇到有效闭合符，真正闭合
                        closerIndex = j;
                        break;
                    }
                } else if (isValidOpener) {
                    stack.push(j); // 遇到有效起始符，压栈
                }

                j += 2;
                continue;
            }
            j++;
        }

        if (!foundCloser) return null;

        // 4. 提取内容递归解析，打包返回
        const innerText = src.slice(index + 2, closerIndex);
        const children = ctx.parseInline(innerText);
        const totalLength = (closerIndex + 2) - index;

        return {
            node: createNode(this.type, totalLength, undefined, children),
            nextIndex: index + totalLength
        };
    }

    /** @inheritdoc */
    render(node: MarkdownNode, ctx: any) {
        return `<strong>${ctx.renderInline(node.children)}</strong>`;
    }
}

export default new StrongInlineParser();