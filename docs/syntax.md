---
title: 语法索引
subtitle: GFM + Penna 扩展一览
version: 0.1.0
tags: [reference, syntax]
repo: https://github.com/AnkioTomas/penna-markdown
---

# [[title]]

> [[subtitle]] — 完整可渲染样例见 [simple.md](simple.md)；边界/压力见 [test.md](test.md)。
> 正确写法一览（人机共用）：[help-ai.md](help-ai.md)。

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
| 上下标           | 下标 `H~2~O` · 上标 `E=mc^2^`   |
| 注释             | `%% hidden %%`                  |
| 脚注引用         | `[^1]`                          |

---

## Penna 块级

| 语法              | 写法                                                  |
| ----------------- | ----------------------------------------------------- |
| YAML Frontmatter  | 文首 `---`                                            |
| Alert             | `> [!NOTE]` 等                                        |
| 扩展任务          | `- [/]` `- [>]` `- [!]` …                             |
| 块级公式          | `$$ … $$`                                             |
| 容器              | `::: tip` · 对齐 `::: center`                         |
| 折叠              | `::: collapse`                                        |
| Tabs / Steps      | `::: tabs` + `@tab` · `::: steps` + `1.`              |
| Timeline          | `::: timeline` + `- [时间:类型] 标题`                 |
| 列布局            | `::: cols` + `@col`（属性如 `max-width=200px`）       |
| 增强代码          | `title=` · 行高亮 `{1,3-5}` · `:collapsed-lines`      |
| Mermaid / ECharts | ` ```mermaid` · ` ```echarts`（支持 `max-width`）     |
| 媒体              | `!video` `!audio` `!iframe`                           |
| 卡片              | `::: card` · `link-card` · `image-card` · `repo-card` |
| 网格 / 瀑布       | `:::: card-grid` · `card-masonry`                     |
| 字段文档          | `::: field` · `:::: field-group`                      |
| 脚注定义          | `[^1]: …`                                             |
| 块注释            | `%%% … %%%`                                           |

---

## 容易写错的地方

| 写法                            | 实际结果                                 |
| ------------------------------- | ---------------------------------------- |
| `H~~2~~O`                       | 删除线，不是下标；下标只用一个 `~`       |
| `:赞:`                          | 原样输出；短码表只有 GitHub 英文名       |
| `::: tabs 标题`                 | 退化成普通容器；标题只能写在 `@tab` 上   |
| `::: steps 标题`                | 同上                                     |
| `- [2025-01-01]`                | 时间轴节点被丢弃；标题必填               |
| `::: timeline` 忘了闭合         | 整块退化成普通容器（其余容器会吞到文末） |
| `link=https://x`                | 卡片属性值必须双引号，否则并入标题       |
| `card-masonry gap="16px"`       | 只认纯数字，回落默认 16                  |
| `card-grid cols="5"`            | 上限 3                                   |
| `::: collapse accordion expand` | `accordion` 优先，`expand` 无效          |

完整正确写法见 [help-ai.md](help-ai.md)。

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
