/**
 * Link Reference Definitions 测试
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, test } from "vitest";
import { createTransformer } from "@/transformer/index.js";

const gfmCases = JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../fixtures/gfm/cases.json"), "utf8"),
);

/** @param {number} id */
function gfmCase(id) {
    const c = gfmCases.find((x) => x.id === id);
    if (!c) throw new Error(`GFM case ${id} not found`);
    return c;
}

/**
 * 用户报告的 GFM 失败用例 + 同章节关联用例
 * @type {{ id: number, name: string }[]}
 */
const GFM_LINK_REF_CASES = [
    { id: 164, name: "多行尖括号 destination 与单引号 title" },
    { id: 165, name: "多行单引号 title" },
    { id: 166, name: "title 内含空行则定义无效" },
    { id: 167, name: "destination 可换行续写" },
    { id: 170, name: "<dest>(title) 无空白分隔 — 非合法定义" },
    { id: 171, name: "destination/title 反斜杠转义与 href 编码" },
    { id: 173, name: "重复定义 first wins" },
    { id: 175, name: "Unicode label 匹配与 href percent-encode" },
    { id: 177, name: "label 含换行 — 消费行但不注册定义" },
    { id: 178, name: "title 后有多余字符 — 整段非定义" },
    { id: 179, name: "单行完整定义后，续行不构成 title" },
    { id: 182, name: "定义不能打断段落" },
    { id: 183, name: "heading 后定义不吸收 blockquote" },
    { id: 184, name: "完整定义不吸收 setext heading 文本" },
    { id: 185, name: "完整定义不将 === 当作 title 续行" },
];

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
'Optional title on next line'

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

    describe("GFM conformance (Link reference definitions)", () => {
        test.each(GFM_LINK_REF_CASES)(
            "example $id: $name",
            ({ id }) => {
                const c = gfmCase(id);
                const { html } = engine.render(c.markdown);
                expect(html).toBe(c.html);
            },
        );
    });
});
