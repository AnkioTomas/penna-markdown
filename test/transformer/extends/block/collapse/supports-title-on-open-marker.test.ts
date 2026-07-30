import { expect, it } from "vitest";
import { createEngine, renderMarkdown } from "../../../../helpers/engine.js";

it("supports title on open marker with complex body", () => {
  const md = `::: collapse 常见问题排查

- **误删了文件但没提交？**

  立即执行 \`git restore <file>\` 恢复。

- **如何忽略已追踪的文件？**
  1. 编辑 \`.gitignore\` 添加规则。
  2. 执行 \`git rm -r --cached .\` 清除缓存。

- **Rebase 与 Merge 的区别？**

  - \`merge\`：保留完整历史分支结构。
  - \`rebase\`：保持线性历史。

:::`;
  const html = renderMarkdown(createEngine(), md);

  expect(html.match(/<details/g)?.length).toBe(1);
  expect(html).toContain("<summary>常见问题排查</summary>");
  expect(html).toContain("<ol>");
  expect(html).toContain("<li>编辑 <code>.gitignore</code> 添加规则。</li>");
  expect(html).toContain("<li><code>rebase</code>：保持线性历史。</li>");
});

it("keeps flags before the title", () => {
  const html = renderMarkdown(
    createEngine(),
    `::: collapse expand 标题\n正文\n:::`,
  );
  expect(html).toContain('<div class="penna-collapse penna-collapse--expand">');
  expect(html).toContain("<details open>\n<summary>标题</summary>");
});
