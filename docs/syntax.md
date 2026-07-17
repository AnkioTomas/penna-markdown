---
title: 语法索引
subtitle: GFM + Penna 扩展一览
version: 0.1.0
tags: [reference, syntax]
repo: https://github.com/AnkioTomas/penna-markdown
---

# [[title]]

> [[subtitle]] — 完整可渲染样例见 [simple.md](simple.md)；边界/压力见 [test.md](test.md)。

---

## 怎么读这份索引

::: tabs
@tab:active 活文档
打开 [语法速览 simple.md](simple.md)：每种语法至少一条可运行样例。
@tab 回归
打开 [完整测试 test.md](test.md)：刻意埋入极端输入，供 AST / 编辑器 / 转换器 Demo 加载。
@tab 自己加语法
看 [扩展语法](extend.md)。
:::

---

## GFM

| 类别      | 示例                            |
| --------- | ------------------------------- |
| 标题      | `# ATX` · Setext                |
| 强调      | `*斜*` `**粗**` `~~删~~`        |
| 链接 / 图 | `[t](url)` `![alt](url)` 引用式 |
| 列表      | `-` `1.` 嵌套 · 任务 `- [ ]`    |
| 引用      | `>`                             |
| 代码      | `` `code` `` · 围栏 · 缩进      |
| 表格      | GFM table                       |
| 分隔线    | `---`                           |
| HTML      | 净化后的原始 HTML               |
| Autolink  | `<https://…>`                   |

---

## Penna 行内

| 语法             | 写法                            |
| ---------------- | ------------------------------- |
| Frontmatter 变量 | `[[title]]` · `[[author.name]]` |
| 高亮             | `==text==` · `==text=={.tip}`   |
| Emoji            | `:smile:`                       |
| HTML 属性        | `**b**{.cls}` · `{#id}`         |
| 徽章             | `[新]{.tip}`                    |
| 剧透             | `!! text !!` · `{click}`        |
| 数学             | `$E=mc^2$`                      |
| 上下标           | `H~2~O` · `E=mc^2^`             |
| 注释             | `%% hidden %%`                  |
| 脚注引用         | `[^1]`                          |

---

## Penna 块级

| 语法                    | 写法                                                  |
| ----------------------- | ----------------------------------------------------- |
| YAML Frontmatter        | 文首 `---`                                            |
| Alert                   | `> [!NOTE]` 等                                        |
| 扩展任务                | `- [/]` `- [>]` `- [!]` …                             |
| 块级公式                | `$$ … $$`                                             |
| 容器                    | `::: tip` · 对齐 `::: center`                         |
| 折叠                    | `::: collapse`                                        |
| Tabs / Steps / Timeline | `::: tabs` · `::: steps` · `::: timeline`             |
| 增强代码                | info string · 行高亮 · 折叠                           |
| Mermaid / ECharts       | ` ```mermaid` · ` ```echarts`                         |
| 媒体                    | `!video` `!audio` `!iframe`                           |
| 卡片                    | `::: card` · `link-card` · `image-card` · `repo-card` |
| 网格 / 瀑布             | `:::: card-grid` · `card-masonry`                     |
| 字段文档                | `::: field` · `:::: field-group`                      |
| 脚注定义                | `[^1]: …`                                             |
| 块注释                  | `%%% … %%%`                                           |

---

## 文档站约定

本目录由 Demo「文档预览」加载：

| 文件          | 作用                               |
| ------------- | ---------------------------------- |
| `_sidebar.md` | 侧栏：`## 分组` + `- [标题](路径)` |
| `_index.md`   | 目录入口                           |

正文里的相对 `.md` 链接可在预览内跳转。

---

## 相关

- [simple.md](simple.md) · [test.md](test.md) · [扩展语法](extend.md)
