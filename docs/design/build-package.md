---
title: 构建与 npm 分包
parent: Cherry Markdown Next 设计文档
---

# [[title]]

[← 返回索引](./index.md)

---

## 构建命令

```bash
pnpm build          # JS bundle + 主题 CSS
pnpm build:theme    # 仅编译 SCSS → dist/*.css
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest run
pnpm demo           # 本地演示站点
```

构建脚本：`scripts/build.ts`（esbuild）+ `scripts/vite.theme.config.ts`（主题 SCSS）。

---

## JS 产物

| 文件                            | 格式 | 说明                                   |
| ------------------------------- | ---- | -------------------------------------- |
| `dist/cherry.min.mjs`           | ESM  | 完整编辑器                             |
| `dist/cherry.min.cjs`           | CJS  | 同上                                   |
| `dist/cherry.min.js`            | IIFE | 全局 `CherryNextEditor`                |
| `dist/cherry-render.min.*`      | 三种 | 渲染器，全局 `CherryNextRenderer`      |
| `dist/cherry-transformer.min.*` | 三种 | 解析引擎，全局 `CherryNextTransformer` |

全部 **minify**，无 sourcemap（ deliberate 减小发布体积）。

---

## CSS 产物

| 文件                               | 用途                                |
| ---------------------------------- | ----------------------------------- |
| `cherry-editor-base.min.css`       | 编辑器布局、工具栏、对话框等 chrome |
| `cherry-render.min.css`            | 渲染内容区基础样式                  |
| `cherry-theme-{id}-editor.min.css` | 各主题编辑器皮肤                    |
| `cherry-theme-{id}-render.min.css` | 各主题渲染皮肤                      |

主题 id 列表与 `ThemeRegister.ts` 一致。

---

## package.json exports

```typescript
// 完整编辑器
import { Cherry } from "cherry-markdown-next";

// 仅渲染
import { Renderer, Theme } from "cherry-markdown-next/renderer";

// 仅解析
import { TransformerEngine } from "cherry-markdown-next/transformer";

// 样式（示例）
import "cherry-markdown-next/cherry-editor-base.min.css";
import "cherry-markdown-next/cherry-theme-github-editor.min.css";
import "cherry-markdown-next/cherry-theme-github-render.min.css";
```

`exports` 还包含 `./cherry-theme-*-render.css` 等 glob 别名，便于按主题 id 动态加载。

---

## 集成示例

### 最小编辑器

```html
<div id="editor"></div>
<link
  rel="stylesheet"
  href="node_modules/cherry-markdown-next/dist/cherry-editor-base.min.css"
/>
<link
  rel="stylesheet"
  href="node_modules/cherry-markdown-next/dist/cherry-theme-default-editor.min.css"
/>
<script type="module">
  import { Cherry } from "cherry-markdown-next";

  new Cherry(document.getElementById("editor"), {
    themeId: "default",
    editor: { value: "# Hello\n\n**world**" },
  });
</script>
```

### 只读渲染页

```typescript
import { Renderer, Theme } from "cherry-markdown-next/renderer";
import "cherry-markdown-next/cherry-theme-notion-render.min.css";

const theme = new Theme();
const mount = document.getElementById("content")!;
theme.setTheme("notion", mount);

const renderer = new Renderer({ mount, theme });
renderer.render(markdownString);
```

### 服务端 AST（无 DOM）

```typescript
import { TransformerEngine } from "cherry-markdown-next/transformer";

const engine = new TransformerEngine();
const ast = engine.parse(markdown);
// 序列化 ast 或 walk 处理
```

---

## 路径别名

源码使用 `@/` → `src/`，在 `tsconfig.json` 与 esbuild `alias` 中配置。发布产物已 bundle，消费者无需配置 alias。

---

## Demo 站点

`demo/` 为 Vite 多页应用：

| 路径                       | 内容                           |
| -------------------------- | ------------------------------ |
| `demo/modules/editor`      | 完整编辑器                     |
| `demo/modules/renderer`    | 独立渲染                       |
| `demo/modules/transformer` | AST 可视化                     |
| `demo/modules/ast`         | 语法树调试                     |
| `demo/syntax/gfm`          | GFM 语法                       |
| `demo/syntax/extends`      | Cherry 扩展语法                |
| `demo/test/gfm`            | GFM 规范用例                   |
| `demo/frameworks/*`        | React / Vue / Vanilla 集成草图 |

---

## 版本与兼容

- **package version**：`0.1.0`（早期 API，可能变更）
- **浏览器 target**：主 bundle ES2020；transformer 额外提供 ES2015 IIFE
- **依赖**：CodeMirror 6、highlight.js 11、entities、yaml

> [!CAUTION]
> 升级 minor 版本前请跑一遍集成测试；`0.x` 不保证 semver 严格兼容。

---

[← 命令与 UI](./commands-ui.md) · [索引](./index.md)
