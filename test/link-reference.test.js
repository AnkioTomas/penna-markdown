/**
 * Link Reference Definitions 测试
 *
 * 测试用例基于 CommonMark / PEP 8 规范
 */

import { createTransformer } from "@/transformer/index.js";

describe("Link Reference Definitions", () => {
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
            console.log("Rendered HTML:", result.html);
            expect(result.html).toContain('<a href="https://example.com">链接</a>');
        });

        test("应该解析带标题的 link reference definition", () => {
            const markdown = `
[bar]: https://example.com "Test Title"
`;

            // 使用 resolveLinkReference 回调来验证定义被正确解析
            const store = {
                resolveLinkReference: (refId) => {
                    const defs = engine.getLinkReferenceStore();
                    const result = defs.resolve(refId);
                    if (result) {
                        console.log(`Resolved ${refId}:`, result);
                    }
                    return result;
                }
            };

            engine = createTransformer({ resolveLinkReference: store.resolveLinkReference });

            const result = engine.render("[text][bar]");
            expect(result.html).toContain('<a href="https://example.com">text</a>');
        });

        test("应该处理多行 title", () => {
            const markdown = `
[baz]: https://example.com
    Optional title on next line
`;

            const store = {
                resolveLinkReference: (refId) => {
                    const defs = engine.getLinkReferenceStore();
                    const result = defs.resolve(refId);
                    console.log(`Resolved ${refId}:`, result);
                    return result;
                }
            };

            engine = createTransformer({ resolveLinkReference: store.resolveLinkReference });

            const result = engine.render("[text][baz]");
            expect(result.html).toContain('title="Optional title on next line"');
        });

        test("应该处理多个 definitions", () => {
            const markdown = `[link1]: https://example.com
[link2]: https://example.org "Title"
`;

            const store = {
                resolveLinkReference: (refId) => {
                    const defs = engine.getLinkReferenceStore();
                    const result = defs.resolve(refId);
                    console.log(`Resolved ${refId}:`, result);
                    return result;
                }
            };

            engine = createTransformer({ resolveLinkReference: store.resolveLinkReference });

            const html1 = engine.render("[a][link1]");
            const html2 = engine.render("[b][link2]");

            expect(html1).toContain('<a href="https://example.com">a</a>');
            expect(html2).toContain('<a href="https://example.org">b</a>');
            expect(html2).toContain('title="Title"');
        });

        test("应该在未找到定义时将引用作为文本渲染", () => {
            const markdown = `[unknown]: https://example.com
[missing]`;

            const store = {
                resolveLinkReference: (refId) => {
                    const defs = engine.getLinkReferenceStore();
                    const result = defs.resolve(refId);
                    console.log(`Resolved ${refId}:`, result);
                    return result;
                }
            };

            engine = createTransformer({ resolveLinkReference: store.resolveLinkReference });

            // 由于定义在引用之后，resolve 应该返回 null
            const result = engine.render("[text][missing]");
            console.log("Result:", result.html);
            // 应该显示为文本而不是链接
        });
    });

    describe("Reference Matching", () => {
        test("应该进行精确匹配", () => {
            const store = {
                resolveLinkReference: (refId) => {
                    const defs = engine.getLinkReferenceStore();
                    const result = defs.resolve(refId);
                    return result;
                }
            };

            engine = createTransformer({ resolveLinkReference: store.resolveLinkReference });

            // 注册定义
            engine.linkReferenceStore.register("exact", "https://exact.com");

            const result = engine.render("[text][exact]");
            expect(result.html).toContain('href="https://exact.com"');
        });

        test("应该进行模糊匹配（label 规范化后匹配）", () => {
            const store = {
                resolveLinkReference: (refId) => {
                    const defs = engine.getLinkReferenceStore();
                    const result = defs.resolve(refId);
                    return result;
                }
            };

            engine = createTransformer({ resolveLinkReference: store.resolveLinkReference });

            // 注册定义（带多个空格）
            engine.linkReferenceStore.register("multi  space  label", "https://multi.com");

            // 使用规范化后的 ref-id
            const result = engine.render("[text][multi space label]");
            expect(result.html).toContain('href="https://multi.com"');
        });

        test("应该处理 label 和 ref-id 的自动归一化", () => {
            const store = {
                resolveLinkReference: (refId) => {
                    const defs = engine.getLinkReferenceStore();
                    const result = defs.resolve(refId);
                    console.log(`Resolve: ${refId} ->`, result);
                    return result;
                }
            };

            engine = createTransformer({ resolveLinkReference: store.resolveLinkReference });

            // 定义中使用多个空格
            const markdown = `[multi   spaces]: https://multi.com`;
            engine.linkReferenceStore.register("multi   spaces", "https://multi.com");

            // 引用时使用单个空格
            const result = engine.render("[text][multi spaces]");
            expect(result.html).toContain('href="https://multi.com"');
        });
    });

    describe("Complex Scenarios", () => {
        test("应该处理带转义字符的 definition", () => {
            const markdown = `
[foo\\bar]: https://example.com
`;

            const store = {
                resolveLinkReference: (refId) => {
                    const defs = engine.getLinkReferenceStore();
                    const result = defs.resolve(refId);
                    console.log(`Resolved ${refId}:`, result);
                    return result;
                }
            };

            engine = createTransformer({ resolveLinkReference: store.resolveLinkReference });

            const result = engine.render("[text][foo\\bar]");
            expect(result.html).toContain('href="https://example.com"');
        });

        test("应该处理带空格的 label", () => {
            const markdown = `[with space]: https://example.com`;

            const store = {
                resolveLinkReference: (refId) => {
                    const defs = engine.getLinkReferenceStore();
                    const result = defs.resolve(refId);
                    console.log(`Resolved ${refId}:`, result);
                    return result;
                }
            };

            engine = createTransformer({ resolveLinkReference: store.resolveLinkReference });

            const result = engine.render("[text][with space]");
            expect(result.html).toContain('href="https://example.com"');
        });
    });
});
