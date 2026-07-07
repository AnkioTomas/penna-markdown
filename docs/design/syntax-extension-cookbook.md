---
title: 自定义语法开发 Cookbook
parent: Cherry Markdown Next 设计文档
---

# [[title]]

[← 返回索引](./index.md)

手把手添加一种 **Cherry 扩展 Markdown 语法**：从 parser 实现、注册、样式到测试。

---

## 开始之前

::: steps

1. 明确语法形态（行内 vs 块级、定界符、是否与 GFM 冲突）
2. 选择 **priority**（见下文「Priority 速查」）
3. 实现 `canOpenAt` + `parse` + `render`
4. 块级 parser 的 `render` 输出 **单个根元素** 并带 `data-hash`
5. 注册到 `TransformerEngineOptions` 并在 demo 加用例
6. 写 Vitest 或 demo 页面验证 parse + render

:::

参考实现：

| 复杂度 | 参考文件 | 语法 |
| --- | --- | --- |
| 行内简单 | `transformer/extends/inline/highlight.ts` | `==text==` |
| 行内+GFM 避让 | `transformer/extends/inline/badge.ts` | `[text]{.tip}` |
| 块级容器 | `transformer/extends/block/alert.ts` | `> [!NOTE]` |
| 块级围栏 | `transformer/extends/block/container.ts` | `::: tip` |

---

## 核心概念

### AST 节点

```typescript
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode";

// 行内叶子
createNode("my_inline", totalCharLength, "literal");

// 行内含 Markdown 子节点
createNode("my_inline", totalCharLength, undefined, ctx.parseInline(inner));

// 块级
createNode("my_block", lineCount, undefined, ctx.parseBlocks(innerLines), {
  customProp: "value",
});
```

**`length` 必须准确**：块级 = 消费的行数；行内 = 源文本字符跨度。错误 `length` 会破坏增量 hash 边界与 scroll-sync。

### 自动 block id

`BlockParseEngine` 为每个顶层块自动赋值：

```text
props.id = "{contentHash}_{random16}"
```

渲染时在根元素输出 `data-hash="${props.id}"`（通过 `BaseBlockParser.sourceLineAttrs`）。**不要**在自定义块里省略这一步，否则增量渲染频繁 fallback。

启用条件：

```typescript
renderOptions: { sourceLineMap: true }
```

---

## Priority 速查

Registry 按 **数字降序** 匹配。内置分层参考：

| 区间 | 典型语法 |
| --- | --- |
| 900+ | `hr`, `strikethrough`, 特殊块 |
| 800 | `table`, `break` |
| 500–600 | `blockquote`, `entity` |
| 400–430 | `code`, `html` 块 |
| 310–320 | `heading`, `list`, `emphasis`/`strong` |
| 230 | `image`, `link`, frontmatter 变量 |
| 0 | `text` / `paragraph` 兜底 |

**规则**：

- 新语法 priority **高于** 可能被误抢的 parser
- 需要让位给 GFM 链接时，在 `canOpenAt` / `parse` 里 **主动 return null**（见 badge 裸 `[text]` 不交还链接）
- 同 `type` 重复注册 = 覆盖，不是叠加

---

## 食谱 A：行内语法 `??text??`

目标：类似 spoiler，渲染为 `<span class="cherry-spoiler">`。

### 1. 实现 Parser

```typescript
// src/transformer/extends/inline/mySpoiler.ts
import { BaseInlineParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import type { InlineParseContext } from "@/transformer/core/context/InlineParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";

class MySpoilerInlineParser extends BaseInlineParser {
  constructor() {
    super("my_spoiler", true); // strongBreak: true，打断 emphasis 扫描
  }

  canOpenAt(src: string, index: number): boolean {
    return src[index] === "?" && src[index + 1] === "?";
  }

  parse(src: string, index: number, ctx: InlineParseContext) {
    const open = "??";
    const start = index + open.length;
    const closeIdx = src.indexOf(open, start);
    if (closeIdx === -1) return null;

    const inner = src.slice(start, closeIdx);
    if (!inner.trim()) return null;

    const totalLength = closeIdx + open.length - index;
    return {
      node: createNode(this.type, totalLength, undefined, ctx.parseInline(inner)),
      nextIndex: index + totalLength,
    };
  }

  render(node, ctx: RenderContext) {
    return `<span class="cherry-spoiler">${ctx.renderInline(node.children ?? [])}</span>`;
  }
}

export default new MySpoilerInlineParser();
```

要点：

- 闭合定界符找不到 → `null`，回退为普通文本
- 内容区用 `ctx.parseInline` 支持 **嵌套 Markdown**
- `render` 用 `ctx.renderInline`，不要手写子节点 HTML

### 2. 注册

```typescript
// extends/index.ts 或应用层注入
import mySpoiler from "./inline/mySpoiler.js";

export const extendInlineSyntax = {
  // ...existing
  51: mySpoiler,  // 高于 text(0)，低于 highlight(49) 按需调整
};
```

或在运行时：

```typescript
new Cherry(el, {
  transformer: {
    inlineParsers: { 51: mySpoilerInlineParser },
    renderOptions: { sourceLineMap: true },
  },
});
```

### 3. 样式

```scss
.cherry-spoiler {
  background: var(--cherry-spoiler-bg, #333);
  color: transparent;
  border-radius: 2px;
  &:hover { color: inherit; }
}
```

---

## 食谱 B：块级语法 `::: mybox`

目标：围栏容器，内部递归 parse Markdown。

### 1. 实现 Parser（简化版）

```typescript
// myBox.ts
import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";

const OPEN_RE = /^ {0,3}::: mybox\s*$/;
const CLOSE_RE = /^ {0,3}:::\s*$/;

class MyBoxBlockParser extends BaseBlockParser {
  constructor() {
    super("my_box"); // strongBreak 默认 true
  }

  canOpenAt(lines: string[], index: number): boolean {
    return OPEN_RE.test(lines[index] ?? "");
  }

  parse(lines: string[], index: number, ctx: BlockParseContext) {
    if (!OPEN_RE.test(lines[index] ?? "")) return null;

    const innerLines: string[] = [];
    let i = index + 1;

    while (i < lines.length) {
      if (CLOSE_RE.test(lines[i] ?? "")) {
        i += 1;
        break;
      }
      innerLines.push(lines[i] ?? "");
      i += 1;
    }

    const node = createNode(
      this.type,
      i - index,
      undefined,
      ctx.parseBlocks(innerLines),
    );
    return { node, nextIndex: i };
  }

  render(node, ctx: RenderContext) {
    const inner = ctx.renderBlock(node.children ?? []);
    return [
      `<div class="cherry-mybox"${this.sourceLineAttrs(node)}>`,
      inner,
      `</div>`,
    ].join("\n");
  }
}

export default new MyBoxBlockParser();
```

要点：

- `canOpenAt` **必须轻量**；`parse` 里才做完整扫描
- 容器内用 `ctx.parseBlocks`，不要自己 split 行内
- `render` 只输出 **一个顶层根** `<div>`；`sourceLineAttrs` 追加 `data-hash`

> [!WARNING]
> 若 `render` 返回多个并列根元素（无单一 wrapper），`BlockIndex.mountFromAstWithContext` 与增量 reconcile 会出错。

### 2. 注册

```typescript
blockParsers: {
  86: myBoxBlockParser,  // 低于 container(87)，按冲突调整
}
```

---

## 食谱 C：覆盖内置 parser

同 `type` 或更高 priority 替换：

```typescript
import atxHeading from "@/transformer/gfm/block/atx_heading.js";

// 包装后改 render，再 register 同 type 会覆盖
class MyHeading extends (atxHeading.constructor as any) {}

new TransformerEngine({
  blockParsers: {
    999: myCustomHeadingParser,
  },
  syntaxOptions: {
    atx_heading: { slug: false },
  },
});
```

`setOptions` / `syntaxOptions` 在 Registry 构造后分发到各 parser 的 `getOptions()`。

---

## 与编辑器高亮对齐（可选）

编辑器 CodeMirror 高亮在 `src/editor/editor/lezer/` 与 `cmSyntax.ts`，与 Transformer **独立**。

若希望编辑区也识别新语法：

1. 在 lezer 扩展里增加 token 规则，或
2. 接受「预览有样式、编辑区仅 plain」——多数扩展语法走此路径

Cookbook 范围仅限 Transformer；CM 高亮为进阶话题。

---

## 测试清单

::: collapse accordion
- Parse 正常路径

  输入样例 Markdown → `engine.parse` → 断言 AST `type` / `children` / `length`

- Parse 失败回退

  未闭合定界符 → 不应产生自定义节点，或整段 fallback 为 paragraph/text

- Render HTML

  `engine.render(ast)` 含预期 class / 结构；用户输入必须 `escapeHtml`

- 增量友好

  改块内一字 → `Renderer.render` 第二次 `partial: true`（debug 日志可见）

- 与 GFM 不打架

  边界样例：链接、 emphasis、code span 与定界符相邻
:::

### Vitest 最小示例

```typescript
import { describe, it, expect } from "vitest";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import mySpoiler from "@/transformer/extends/inline/mySpoiler.js";

describe("my_spoiler", () => {
  const engine = new TransformerEngine({
    inlineParsers: { 51: mySpoiler },
    renderOptions: { sourceLineMap: true },
  });

  it("parses and renders", () => {
    const md = "hello ??secret?? world";
    const ast = engine.parse(md);
    const html = engine.render(ast);
    expect(html).toContain('class="cherry-spoiler"');
    expect(html).toContain("secret");
  });
});
```

---

## 常见坑

> [!CAUTION]
> **坑 1：`canOpenAt` 里写 store** — 预检阶段禁止副作用；链接引用、脚注等状态在 `parse` 阶段写入 `ParserStore`。

> [!CAUTION]
> **坑 2：块 `length` 算错** — 多吞/少吞行会导致 AST 行号与源码错位，scroll-sync 漂移。

> [!CAUTION]
> **坑 3：行内 `nextIndex` 错误** — 导致后续字符被跳过或重复 parse。

> [!CAUTION]
> **坑 4：render 多个根节点** — 破坏 `mount.children` ↔ `blocks` 一一对应。

> [!CAUTION]
> **坑 5：priority 过低** — 被 paragraph / link 抢先匹配，表现为「语法不生效」。

---

## 调试技巧

```typescript
const cherry = new Cherry(el, { debug: true });
```

| 现象 | 排查 |
| --- | --- |
| 预览不更新 | 看 `editor:change` 是否触发 |
| 总全量渲染 | 看 `render:full` 的 failReason |
| AST 不对 | `demo/modules/transformer` 或 `demo/modules/ast` 可视化 |
| 样式缺失 | 是否加载 `cherry-render` / 主题 render CSS |

---

## 提交前 Checklist

- [ ] `canOpenAt` 廉价、无副作用
- [ ] 用户文本经 `escapeHtml`
- [ ] 块级单根 + `sourceLineAttrs`（启用 sourceLineMap）
- [ ] priority 文档化（注释写为何选该数字）
- [ ] `docs/simple.md` 或 demo 有一条样例
- [ ] 测试覆盖 parse + render 主路径

---

[← API 参考](./api-reference.md) · [索引](./index.md)
