<p align="center">
  <img src="https://socialify.git.ci/AnkioTomas/penna-markdown/image?description=1&font=Source%20Code%20Pro&forks=1&issues=1&logo=https%3A%2F%2Fraw.githubusercontent.com%2FAnkioTomas%2Fpenna-markdown%2Fmain%2Flogo%2Fandroid-chrome-512x512.png&name=1&pattern=Floating%20Cogs&pulls=1&stargazers=1&theme=Auto" alt="Penna Markdown" width="640" height="320" />
</p>

<p align="center">
  <a href="https://penna.ankio.net/"><img src="https://img.shields.io/badge/website-penna.ankio.net-0ea5e9?style=flat-square" alt="website" /></a>
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

官网：[penna.ankio.net](https://penna.ankio.net/) · 仓库：[AnkioTomas/penna-markdown](https://github.com/AnkioTomas/penna-markdown)

## 特性

- **GFM + Penna 扩展**：高亮、剧透、徽章、Tabs/Steps/Timeline、卡片体系等
- **三入口分包**：编辑器 / 渲染器 / 转换器可单独引用
- **增量预览**：脏块更新，失败自动全量兜底
- **主题**：`default`（Logo 品牌色）/ `claude` / `github` / `morandi` / `latex` / `vue` / `notion`
- **钩子**：`editor.onAiRequest`（行级 diff，取消走 `AbortSignal`）、`editor.onParseFile`（粘贴/拖入上传）
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

### 图表库：每种库按自己的 API 接入

图表渲染有两条不同路径：默认远程图片 API 不需要引入图表依赖；本地渲染则由宿主引入需要的 JS 库，并通过 `engines` 交给 Penna。三种库的调用方式不同：

| 配置项 | 库 API | Penna 如何调用 |
| --- | --- | --- |
| `math` | KaTeX `renderToString(tex, options)` | 同步生成公式 HTML；宿主还需引入 KaTeX CSS |
| `mermaid` | Mermaid `render(id, text)` | 异步生成 SVG；Penna 负责初始化严格安全模式和主题 |
| `echarts` | ECharts `init(dom, theme)` | 在容器初始化实例，再调用 `setOption`；Penna 管理实例销毁 |

按需选择配置，未配置的类型仍走远程图片 API：

```typescript
import katex from "katex";
import "katex/dist/katex.min.css";
import mermaid from "mermaid";
import * as echarts from "echarts";
import { Renderer, type GraphEngines } from "penna-markdown/renderer";

const engines: GraphEngines = {
  math: katex,
  mermaid,
  echarts,
};

const renderer = new Renderer({
  mount, theme, eventBus, logger,
  engines,
});
```

`TransformerEngine` 及 `Renderer.render()` 本身仍同步返回结果；配置外部库后，图表水合（尤其 Mermaid）会异步完成并更新 DOM。`Renderer` 用 `engines`；完整编辑器用 `preview.engines`，切换时调用 `renderer.setEngines(engines)` 或 `penna.setEngines(engines)`。也可传 `() => import("mermaid")` 延迟加载，或传 `"global"` 使用页面 `<script>` 已挂载的 `window.katex` / `window.mermaid` / `window.echarts`。ECharts 配置块只解析数据对象，不执行 `formatter: function(){}` 等函数代码。

详细的逐库示例、API 差异和错误回退行为见 [`docs/renderer.md`](docs/renderer.md) 与 [`docs/editor.md`](docs/editor.md)；官网文档见 [渲染器集成指南](https://penna.ankio.net/guide/renderer)。

## 文档与演示

- 官网文档：[https://penna.ankio.net/](https://penna.ankio.net/)
- 仓库文档：[`docs/`](docs/)（用 Penna 语法编写，可在 Demo「文档预览」中阅读）
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
