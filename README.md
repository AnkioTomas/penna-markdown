<p align="center">
  <img src="https://socialify.git.ci/AnkioTomas/penna-markdown/image?description=1&font=Source%20Code%20Pro&forks=1&issues=1&logo=https%3A%2F%2Fraw.githubusercontent.com%2FAnkioTomas%2Fpenna-markdown%2Fmain%2Flogo%2Fandroid-chrome-512x512.png&name=1&pattern=Floating%20Cogs&pulls=1&stargazers=1&theme=Auto" alt="Penna Markdown" width="640" height="320" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/penna-markdown"><img src="https://img.shields.io/npm/v/penna-markdown.svg?style=flat-square" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/penna-markdown"><img src="https://img.shields.io/npm/dm/penna-markdown.svg?style=flat-square" alt="npm downloads" /></a>
  <a href="https://www.npmjs.com/package/penna-markdown"><img src="https://img.shields.io/npm/l/penna-markdown.svg?style=flat-square" alt="license" /></a>
  <a href="https://github.com/AnkioTomas/penna-markdown/stargazers"><img src="https://img.shields.io/github/stars/AnkioTomas/penna-markdown.svg?style=flat-square" alt="GitHub stars" /></a>
  <a href="https://github.com/AnkioTomas/penna-markdown/issues"><img src="https://img.shields.io/github/issues/AnkioTomas/penna-markdown.svg?style=flat-square" alt="GitHub issues" /></a>
</p>

浏览器端 Markdown **编辑 + 渲染** 套件：GFM 标准语法，加上 Alert、容器、卡片、公式、Mermaid/ECharts 等 Penna 扩展；编辑时走增量预览。

| 包入口                       | 职责                                        |
| ---------------------------- | ------------------------------------------- |
| `penna-markdown`             | 完整编辑器（工具栏 / 侧栏 / 编辑区 / 预览） |
| `penna-markdown/renderer`    | Markdown → DOM（增量更新）                  |
| `penna-markdown/transformer` | Markdown → AST → HTML 字符串                |

仓库：[AnkioTomas/penna-markdown](https://github.com/AnkioTomas/penna-markdown)

## 特性

- **GFM + Penna 扩展**：高亮、剧透、徽章、Tabs/Steps/Timeline、卡片体系等
- **三入口分包**：编辑器 / 渲染器 / 转换器可单独引用
- **增量预览**：脏块更新，失败自动全量兜底
- **主题**：`default`（Logo 品牌色）/ `claude` / `github` / `morandi` / `latex` / `vue` / `notion`
- **钩子**：`editor.onAiRequest`（行级 diff）、`editor.onParseFile`（粘贴/拖入上传）
- **可扩展**：按 priority 注册自定义行内/块级 Parser

## 安装

```bash
pnpm add penna-markdown
```

## 快速开始

### 完整编辑器

```html
<div id="editor" style="height: 100vh"></div>
<link
  rel="stylesheet"
  href="node_modules/penna-markdown/dist/penna-editor-base.min.css"
/>
<link
  rel="stylesheet"
  href="node_modules/penna-markdown/dist/penna-render.min.css"
/>
<!-- 可选皮肤（非 default）：再引入 penna-theme-{id}-editor/render.min.css -->
```

```typescript
import { Penna } from "penna-markdown";

const penna = new Penna(document.getElementById("editor")!, {
  themeId: "default",
  layout: "split",
  editor: {
    value: "# Hello\n\n**Penna Markdown**",
  },
});
```

### 只要 AST / HTML

```typescript
import { TransformerEngine } from "penna-markdown/transformer";

const engine = new TransformerEngine();
const ast = engine.parse("# Hello\n\n**world**");
const html = engine.render(ast);
```

独立 DOM 渲染见 [`docs/renderer.md`](docs/renderer.md)。

## 文档与演示

- 项目文档：[`docs/`](docs/)（用 Penna 语法编写，可在 Demo「文档预览」中阅读）
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

## 特别鸣谢

- [LinuxDo](https://linux.do/)
- [CherryMarkdown](https://github.com/Tencent/cherry-markdown/)

## License

[MIT](./LICENSE) © AnkioTomas
