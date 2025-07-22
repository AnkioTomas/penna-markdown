<div align="center">
  <img src="logo/android-chrome-512x512.png" alt="Penna Logo" width="128" />
</div>

# Penna Markdown

基于 [CodeMirror](https://codemirror.net/) 的现代化 Markdown 编辑器，支持编辑、实时预览、目录导航等功能，适合二次开发和自定义集成。

> **重要说明**
> 
> 目前Penna Markdown还在**缓慢**开发中，不能作为正式生产使用
>

## 特性

- ✍️ 编辑与实时预览并存，支持多种模式切换
- 🗂️ 自动生成 Markdown 目录（TOC）
- 🧩 组件化设计，易于扩展
- 🎨 SCSS 样式，方便自定义主题
- 🛠️ 内置日志与事件系统，便于调试和功能扩展

## 快速开始

### 安装依赖

```bash
yarn install
# 或
npm install
```

### 本地开发

```bash
yarn dev
# 或
npm run dev
```

### 构建生产包

```bash
yarn build
# 或
npm run build
```

## 使用示例

在你的 HTML 文件中添加容器：

```html
<div id="app"></div>
```

在 JS 中初始化编辑器：

```js
import Penna from "你的路径/src/Penna.js";
const penna = new Penna({
  container: "#app"
});
```

## 配置项

`Penna` 支持以下配置：

```js
{
  container: "#penna-editor", // 编辑器挂载的DOM选择器
  editor: {
    mode: "edit&preview", // 可选: "edit&preview" | "preview" | "edit"
  }
}
```

## 目录结构说明

- `src/core/`：核心组件（编辑器、预览、头部、底部、目录）
- `src/utils/`：工具类（日志、事件）
- `src/scss/`：样式文件，支持自定义
- `demo/`：示例页面和入口

## 依赖

- [codemirror](https://www.npmjs.com/package/codemirror)
- [markdown-it](https://www.npmjs.com/package/markdown-it)
- [mitt](https://www.npmjs.com/package/mitt)
- [vite](https://vitejs.dev/)（开发与构建工具）

## 贡献

欢迎提 issue 和 PR！

## License

MIT
