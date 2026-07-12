---
title: 主题
subtitle: 皮肤 CSS · Theme · 明暗
version: 0.1.0
tags: [guide, themes]
---

# [[title]]

> [[subtitle]] — 编辑器 chrome 与预览内容区分两套 CSS。

---

## 内置皮肤

| id        | 说明         |
| --------- | ------------ |
| `default` | 默认         |
| `claude`  | Claude 风格  |
| `github`  | GitHub       |
| `morandi` | 莫兰迪       |
| `latex`   | 学术 / LaTeX |
| `vue`     | Vue 绿       |
| `notion`  | Notion       |

---

## 需要引入的 CSS

::: tabs
@tab:active 完整编辑器

```html
<link rel="stylesheet" href="cherry-markdown-next/cherry-editor-base.min.css" />
<link
  rel="stylesheet"
  href="cherry-markdown-next/cherry-theme-{id}-editor.min.css"
/>
<link
  rel="stylesheet"
  href="cherry-markdown-next/cherry-theme-{id}-render.min.css"
/>
```

@tab 仅渲染

```html
<link
  rel="stylesheet"
  href="cherry-markdown-next/cherry-theme-{id}-render.min.css"
/>
```

:::

把 `{id}` 换成上表中的皮肤 id。也可用：

```typescript
import "cherry-markdown-next/theme/github/editor.css";
import "cherry-markdown-next/theme/github/render.css";
```

---

## Theme API

`Theme` 只切换 DOM class，不直接改样式表：

| 元素               | class                              | 作用                                  |
| ------------------ | ---------------------------------- | ------------------------------------- |
| 挂载根（用户传入） | `cherry-theme-{id}`、`cherry-dark` | 皮肤变量与 chrome                     |
| 预览节点           | `cherry-render`（由调用方添加）    | 命中 `.cherry-theme-* .cherry-render` |

```typescript
theme.setTheme("github"); // 未知 id 会打错误日志并跳过
theme.setLightDark("dark");
theme.list(); // 可用 id；白名单为空/省略 = 全部内置
theme.getTheme(); // { id, mode, isDark, root }
```

编辑器里通过构造选项设置：

```typescript
new Cherry(el, {
  themeId: "github",
  appearance: "dark",
  themes: ["github", "notion"], // 工具栏主题菜单白名单
});
```

运行时仍可：

```typescript
cherry.theme.setTheme("notion");
cherry.theme.setLightDark("light");
```

---

## 事件

| 事件                                           | 时机         |
| ---------------------------------------------- | ------------ |
| `theme:skin`（`THEME_EVENT_SKIN`）             | 皮肤 id 变化 |
| `theme:light-dark`（`THEME_EVENT_LIGHT_DARK`） | 明暗变化     |

Renderer 订阅明暗变化后会同步图表主题。

---

## 相关

- [编辑器](editor.md) · [渲染器](renderer.md) · [快速开始](getting-started.md)
