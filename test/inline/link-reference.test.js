/**
 * Link Reference Definitions 测试
 */

import { beforeAll, describe, expect, test } from "vitest";
import { createTransformer } from "@/transformer/index.js";

describe("inline/link-reference", () => {
    let engine;

    beforeAll(() => {
        engine = createTransformer();
    });

    describe("Definition Parsing", () => {
        test("应该解析基本的 link reference definition", () => {
            const markdown = `
# 测试

这是一个 [链接][foo]。

[foo]: https://example.com
`;

            const result = engine.render(markdown);
            expect(result.html).toContain('<a href="https://example.com">链接</a>');
        });

        test("应该解析带标题的 link reference definition", () => {
            const markdown = `[bar]: https://example.com "Test Title"

[text][bar]`;

            const result = engine.render(markdown);
            expect(result.html).toContain('href="https://example.com"');
            expect(result.html).toContain('title="Test Title"');
            expect(result.html).toContain('>text</a>');
        });

        test("应该处理多行 title", () => {
            const markdown = `[baz]: https://example.com
    Optional title on next line

[text][baz]`;

            const result = engine.render(markdown);
            expect(result.html).toContain('title="Optional title on next line"');
        });

        test("应该处理多个 definitions", () => {
            const markdown = `[link1]: https://example.com
[link2]: https://example.org "Title"

[a][link1]

[b][link2]`;

            const result = engine.render(markdown);
            expect(result.html).toContain('href="https://example.com"');
            expect(result.html).toContain('>a</a>');
            expect(result.html).toContain('href="https://example.org"');
            expect(result.html).toContain('>b</a>');
            expect(result.html).toContain('title="Title"');
        });

        test("应该在未找到定义时将引用作为文本渲染", () => {
            const result = engine.render("[text][missing]");
            expect(result.html).toContain("[text][missing]");
        });
    });

    describe("Reference Matching", () => {
        test("应该进行精确匹配", () => {
            const markdown = `[exact]: https://exact.com

[text][exact]`;

            const result = engine.render(markdown);
            expect(result.html).toContain('href="https://exact.com"');
        });

        test("应该进行模糊匹配（label 规范化后匹配）", () => {
            const markdown = `[multi  space  label]: https://multi.com

[text][multi space label]`;

            const result = engine.render(markdown);
            expect(result.html).toContain('href="https://multi.com"');
        });

        test("应该处理 label 和 ref-id 的自动归一化", () => {
            const markdown = `[multi   spaces]: https://multi.com

[text][multi spaces]`;

            const result = engine.render(markdown);
            expect(result.html).toContain('href="https://multi.com"');
        });
    });

    describe("Complex Scenarios", () => {
        test("应该处理带转义字符的 definition", () => {
            const markdown = `[foo\\bar]: https://example.com

[text][foo\\bar]`;

            const result = engine.render(markdown);
            expect(result.html).toContain('href="https://example.com"');
        });

        test("应该处理带空格的 label", () => {
            const markdown = `[with space]: https://example.com

[text][with space]`;

            const result = engine.render(markdown);
            expect(result.html).toContain('href="https://example.com"');
        });
    });
});
