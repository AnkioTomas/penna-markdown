# Cherry Markdown Next 设计文档（Transformer + Editor + Renderer）

## 1. 设计目标

在 `cherry-markdown` 现有实现基础上迁移，建设下一代内核，并最终只对外提供三个独立包：

- `transformer.js`：语法转换（Markdown -> AST -> HTML）
- `editor.js`：编辑器（CodeMirror 6）
- `renderer.js`：渲染器（DOM 挂载与增量更新）

核心约束：

- 迁移优先，保证历史语法尽量不破坏
- 强边界，避免语法、编辑器、预览逻辑再次耦合
- 多格式发布，支持传统 script、Node、Vue/React/Vite/WebpAack

## 2. 总体架构

单向数据流：

1. `Editor` 产生 Markdown 文本
2. `Transformer` 解析并输出 `RenderResult`
3. `Renderer` 将结果挂载到目标 DOM

即：

`markdown(text) -> parse(ast) -> render(html + map + meta) -> mount(dom)`

## 3. 包边界定义

### 3.1 transformer（语法转换）

职责：

- 解析 Markdown 为 AST
- AST 转 HTML 字符串
- 产出 SourceMap/位置信息（用于滚动同步与增量更新）
- 提供语法插件机制

禁止：

- 访问 DOM
- 依赖 CodeMirror
- 直接管理主题和 UI 状态

建议 API：

```ts
export interface TransformerOptions {
  syntax?: SyntaxRegistry;
  sanitize?: Sanitizer;
  linkResolver?: (url: string) => string;
}

export interface ParseResult {
  ast: MdAst;
  errors: TransformerError[];
}

export interface RenderResult {
  html: string;
  map?: SourceMap;
  meta?: Record<string, unknown>;
  errors: TransformerError[];
}

export interface Transformer {
  parse(markdown: string): ParseResult;
  render(input: string | MdAst): RenderResult;
  stringify(ast: MdAst): { markdown: string; errors: TransformerError[] };
  use(plugin: SyntaxPlugin): void;
}

export function createTransformer(opts?: TransformerOptions): Transformer;
```

### 3.2 editor（CodeMirror 6）

职责：

- 管理编辑区与输入事件
- 提供命令系统（标题、加粗、列表、代码块等）
- 将文本变化推送给上层

禁止：

- 直接调用 Markdown 解析器细节
- 直接操作预览 DOM

建议 API：

```ts
export interface EditorOptions {
  mount: HTMLElement;
  initial?: string;
  extensions?: unknown[];
}

export interface Editor {
  getMarkdown(): string;
  setMarkdown(md: string): void;
  focus(): void;
  onChange(cb: (markdown: string) => void): () => void;
  execute(command: string, payload?: unknown): void;
  use(plugin: EditorPlugin): void;
  destroy(): void;
}

export function createEditor(opts: EditorOptions): Editor;
```

### 3.3 renderer（渲染器）

职责：

- 负责 DOM 挂载与更新
- 提供多种渲染策略（`innerHTML` / `vdom` / `patch`）
- 承载渲染增强插件（代码块按钮、懒加载、图表挂载）

禁止：

- 重新解析 Markdown
- 持有编辑器状态

建议 API：

```ts
export interface RendererOptions {
  mount: HTMLElement;
  strategy?: 'innerHTML' | 'vdom' | 'patch';
  sanitize?: Sanitizer;
}

export interface RendererInput {
  html: string;
  map?: SourceMap;
  meta?: Record<string, unknown>;
}

export interface Renderer {
  update(input: RendererInput): void;
  use(plugin: RendererPlugin): void;
  destroy(): void;
}

export function createRenderer(opts: RendererOptions): Renderer;
```

## 4. 推荐目录结构（单仓 src，多入口构建）

```text
cherry-markdown-next/
  src/
    transformer/     # 语法转换
    renderer/        # DOM 渲染
    editor/          # 编排 CM6 + transformer + renderer
    compat-legacy/   # 旧 hooks 迁移适配
  test/
  scripts/build.js   # 多产物构建（esm/cjs/iife）
  dist/
    transformer.{mjs,cjs,iife.js}
    renderer.{mjs,cjs,iife.js}
    editor.{mjs,cjs,iife.js}
```

说明：

- 源码统一在 `src`，模块间可直接 `import` 相互依赖
- `editor` 强依赖 `transformer` 与 `renderer`，对外是主入口
- 构建时按入口输出多个 JS，而非拆成多个 npm 子包

## 5. 构建与发布策略（多格式）

每个包都输出：

- `ESM`：给 Vite/Webpack/Rollup（Vue/React/Svelte）
- `CJS`：给 Node 和旧链路
- `IIFE`（或 UMD）：给 `<script>` 直接引用

每包建议 `package.json`（示例）：

```json
{
  "name": "@cherry-next/transformer",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "unpkg": "./dist/index.iife.js",
  "jsdelivr": "./dist/index.iife.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    }
  },
  "files": ["dist"]
}
```

构建工具建议：

- 用 `tsup` 或 `rollup` 统一输出 `mjs/cjs/iife + d.ts`
- 保持三包构建脚本一致，减少心智负担

## 6. 迁移计划（从 cherry-markdown 平滑过渡）

### 阶段 A：最小可运行链路

- 完成 `Editor(CM6) -> Transformer -> Renderer` 闭环
- `Transformer` 先支持 CommonMark + 最关键扩展

### 阶段 B：兼容层接入

- 将 `src/core/hooks/*` 封装为 `compat-legacy` 适配插件
- 建立语法快照回归测试，和现有 `cherry-markdown` 对照

### 阶段 C：原生化替换

- 逐步重写高频插件（CodeBlock/Table/List/Image）
- 将性能逻辑放入 `renderer` 策略层，不污染 transformer

### 阶段 D：收敛

- 清理兼容层中的低价值逻辑
- 稳定 API 后发布 `1.0.0`

## 7. 兼容策略与破坏控制

必须遵守：

- 默认语法行为不应无提示改变
- 不删除老配置项，先做映射和 deprecate 告警
- 提供 `legacy` 模式开关作为迁移兜底

建议输出迁移工具：

- `migrateConfig(oldConfig) -> newConfig`
- 配置变更日志（字段级映射）

## 8. 质量门禁（验收标准）

- 语法兼容：历史样本文档快照通过率 >= 95%
- 编辑性能：10k 行文档可编辑，输入延迟在可接受范围
- 体积目标：按需引入时 `transformer/editor/renderer` 互不拖累
- 兼容目标：以下场景可运行
  - 传统 script 标签
  - Vue 3 + Vite
  - React + Vite
  - Node CJS

## 9. 首批开发任务清单

1. 初始化 monorepo 与三包骨架
2. 搭建统一构建（ESM/CJS/IIFE + d.ts）
3. 完成 `editor` 的 CM6 最小封装
4. 完成 `transformer` 的 AST 与 render 基础能力
5. 完成 `renderer` 的 `innerHTML` 策略与插件接口
6. 建立 `playground/vanilla + vue + react` 三套 demo
7. 建立快照回归：对比 legacy 渲染结果

---

这份文档是开工基线，不是宣传稿。后续实现中，一切设计变更都必须回答三个问题：

1. 这是实际问题还是想象问题？
2. 有没有更简单方案？
3. 会破坏什么？

  
