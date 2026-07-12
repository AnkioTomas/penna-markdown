---
title: 扩展语法
subtitle: 自定义 Parser 速成
version: 0.1.0
tags: [guide, extend]
---

# [[title]]

> [[subtitle]] — 注册表按 priority 匹配，先命中者胜出。

---

## 流程

::: steps

1. 定形态：行内还是块级、定界符、是否与 GFM 冲突
2. 选 **priority**（越大越先试）
3. 实现 `canOpenAt` + `parse` + `render`
4. 块级 `render` 输出**单个根元素**（增量 DOM 依赖）
5. 注入 `inlineParsers` / `blockParsers`
6. 用 Vitest 或 demo 验证

:::

参考实现：

| 类型 | 文件                                          | 语法           |
| ---- | --------------------------------------------- | -------------- |
| 行内 | `src/transformer/extends/inline/highlight.ts` | `==text==`     |
| 行内 | `src/transformer/extends/inline/badge.ts`     | `[text]{.tip}` |
| 块级 | `src/transformer/extends/block/alert.ts`      | `> [!NOTE]`    |
| 块级 | `src/transformer/extends/block/container.ts`  | `::: tip`      |

---

## 行内 Parser 骨架

```typescript
import { BaseInlineParser } from "@/transformer/core/ParserBase";
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode";
import type { InlineParseContext } from "@/transformer/core/context/InlineParseContext";
import type { RenderContext } from "@/transformer/core/context/RenderContext";
import type { InlineParseResult } from "@/transformer/core/ParserBase";

class AtParser extends BaseInlineParser {
  constructor() {
    super("custom_at", true);
  }

  override canOpenAt(src: string, index: number): boolean {
    return src.startsWith("@@", index);
  }

  override parse(
    src: string,
    index: number,
    _ctx: InlineParseContext,
  ): InlineParseResult | null {
    const start = index + 2;
    const end = src.indexOf("@@", start);
    if (end < 0) return null;
    const text = src.slice(start, end);
    return {
      node: createNode("custom_at", end - index + 2, undefined, undefined, {
        text,
      }),
      nextIndex: end + 2,
    };
  }

  override render(node: MarkdownNode, _ctx: RenderContext): string {
    const text = String(node.props?.text ?? "");
    return `<span class="my-at">@${text}</span>`;
  }
}
```

> [!WARNING]
> `length`（`createNode` 第二参）必须等于源文本字符跨度，否则增量边界会错。

---

## 注入位置

::: tabs
@tab:active 编辑器

```typescript
new Cherry(el, {
  preview: {
    transformerEngineOptions: {
      inlineParsers: { 1001: new AtParser() },
    },
  },
});
```

@tab 独立 Renderer

```typescript
new Renderer({
  mount,
  theme,
  eventBus,
  logger,
  inlineParsers: { 1001: new AtParser() },
});
```

@tab 仅 Transformer

```typescript
new TransformerEngine({
  inlineParsers: { 1001: new AtParser() },
});
```

:::

---

## Priority 直觉

- 比常见 GFM 行内更「特殊」的定界符 → 用更高 priority，避免被 emphasis 吃掉
- 不确定时看 `src/transformer/gfm/index.ts` 与 `extends/index.ts` 现有数字再插空

---

## 样式

预览样式写在主题 / render SCSS 中，挂在 `.cherry-render` 下。编辑器 chrome 样式不要塞进 `transformer/` 内容样式目录。

---

## 相关

- [语法索引](syntax.md) · [转换器](transformer.md) · [活样例 simple.md](simple.md)
