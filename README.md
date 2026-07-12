<p align="center">
  <img src="https://socialify.git.ci/AnkioTomas/cherry-markdown-next/image?description=1&font=Source%20Code%20Pro&forks=1&issues=1&logo=https%3A%2F%2Fraw.githubusercontent.com%2FAnkioTomas%2Fcherry-markdown-next%2Fmain%2Flogo%2Fandroid-chrome-512x512.png&name=1&pattern=Floating%20Cogs&pulls=1&stargazers=1&theme=Auto" alt="Cherry Markdown Next" width="640" height="320" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cherry-markdown-next"><img src="https://img.shields.io/npm/v/cherry-markdown-next.svg?style=flat-square" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/cherry-markdown-next"><img src="https://img.shields.io/npm/dm/cherry-markdown-next.svg?style=flat-square" alt="npm downloads" /></a>
  <a href="https://www.npmjs.com/package/cherry-markdown-next"><img src="https://img.shields.io/npm/l/cherry-markdown-next.svg?style=flat-square" alt="license" /></a>
  <a href="https://github.com/AnkioTomas/cherry-markdown-next/stargazers"><img src="https://img.shields.io/github/stars/AnkioTomas/cherry-markdown-next.svg?style=flat-square" alt="GitHub stars" /></a>
  <a href="https://github.com/AnkioTomas/cherry-markdown-next/issues"><img src="https://img.shields.io/github/issues/AnkioTomas/cherry-markdown-next.svg?style=flat-square" alt="GitHub issues" /></a>
</p>

浏览器端 Markdown **编辑 + 渲染** 套件：GFM 标准语法，加上 Alert、容器、卡片、公式、Mermaid/ECharts 等 Cherry 扩展；编辑时走增量预览。

| 包入口                             | 职责                                        |
| ---------------------------------- | ------------------------------------------- |
| `cherry-markdown-next`             | 完整编辑器（工具栏 / 侧栏 / 编辑区 / 预览） |
| `cherry-markdown-next/renderer`    | Markdown → DOM（增量更新）                  |
| `cherry-markdown-next/transformer` | Markdown → AST → HTML 字符串                |

仓库：[AnkioTomas/cherry-markdown-next](https://github.com/AnkioTomas/cherry-markdown-next)

## 特性

- **GFM + Cherry 扩展**：高亮、剧透、徽章、Tabs/Steps/Timeline、卡片体系等
- **三入口分包**：编辑器 / 渲染器 / 转换器可单独引用
- **增量预览**：脏块更新，失败自动全量兜底
- **主题**：`default` / `claude` / `github` / `morandi` / `latex` / `vue` / `notion`
- **钩子**：`onAiRequest`（行级 diff）、`onParseFile`（粘贴/拖入上传）
- **可扩展**：按 priority 注册自定义行内/块级 Parser

## 安装

```bash
pnpm add cherry-markdown-next
```

## 快速开始

### 完整编辑器

```html
<div id="editor" style="height: 100vh"></div>
<link
  rel="stylesheet"
  href="node_modules/cherry-markdown-next/dist/cherry-editor-base.min.css"
/>
<link
  rel="stylesheet"
  href="node_modules/cherry-markdown-next/dist/cherry-render.min.css"
/>
<!-- 可选皮肤（非 default）：再引入 cherry-theme-{id}-editor/render.min.css -->
```

```typescript
import { Cherry } from "cherry-markdown-next";

const cherry = new Cherry(document.getElementById("editor")!, {
  themeId: "default",
  layout: "split",
  editor: {
    value: "# Hello\n\n**Cherry Markdown Next**",
  },
});
```

### 只要 AST / HTML

```typescript
import { TransformerEngine } from "cherry-markdown-next/transformer";

const engine = new TransformerEngine();
const ast = engine.parse("# Hello\n\n**world**");
const html = engine.render(ast);
```

独立 DOM 渲染见 [`docs/renderer.md`](docs/renderer.md)。

## 文档与演示

- 项目文档：[`docs/`](docs/)（用 Cherry 语法编写，可在 Demo「文档预览」中阅读）
- 语法活样例：[`docs/simple.md`](docs/simple.md)
- 本地演示站：

```bash
pnpm install
pnpm demo
```

## 开发

```bash
pnpm build       # JS + 主题 CSS → dist/
pnpm build:theme # 仅样式
pnpm test        # vitest
pnpm typecheck
```

## License

[MIT](./LICENSE) © AnkioTomas
