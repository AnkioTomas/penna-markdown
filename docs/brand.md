---
title: 品牌视觉
subtitle: Logo · 色板 · default 主题
version: 0.1.0
tags: [guide, brand, themes]
---

# [[title]]

> [[subtitle]] — 一切品牌色以羽毛 Logo 为准，禁止「差不多」的近似色和冲淡描边。

---

## 原则

1. **Logo 是唯一真相**：色值采样自 `logo/android-chrome-512x512.png` 填充区中位色，写在 `src/theme/style/common/_tokens.scss`。
2. **default 主题 = 品牌皮肤**：纸色底、**实心**墨线描边、光谱强调色。
3. **其它皮肤是换装**：`github` / `notion` 等可覆盖；不要反过来污染 default。
4. **Demo 必须同源**：`demo/home.scss` 只 `@use` `$penna-logo-*` / tokens，禁止第二套 hex。
5. **编辑器安静**：品牌色做链接 / 语义强调即可；不要把 Logo 海报风搬进编辑区。

---

## Logo 色板（实采样）

| 角色 | 变量                 | 色值      | 用途                             |
| ---- | -------------------- | --------- | -------------------------------- |
| 纸色 | `$penna-logo-paper`  | `#edebe7` | Demo / PWA；**不是**编辑器默认底 |
| 墨线 | `$penna-logo-ink`    | `#0c1c25` | 正文色                           |
| 主蓝 | `$penna-logo-blue`   | `#008dee` | brand-1 / CTA / note             |
| 青   | `$penna-logo-cyan`   | `#0ac1e3` | brand-3 / important              |
| 绿   | `$penna-logo-green`  | `#16bf73` | tip                              |
| 黄   | `$penna-logo-yellow` | `#fec933` | warning mark / Demo 光谱         |
| 橙   | `$penna-logo-orange` | `#fe9138` | warning                          |
| 红   | `$penna-logo-red`    | `#f33a3c` | danger / code fg                 |

```css
--penna-c-logo-paper
--penna-c-logo-ink
--penna-c-logo-cyan
--penna-c-logo-blue
--penna-c-logo-green
--penna-c-logo-yellow
--penna-c-logo-orange
--penna-c-logo-red
--penna-c-stroke   /* 浅色=ink，暗色=paper */
```

语义映射：`note`→蓝 · `tip`→绿 · `warning`→橙/黄 · `caution`/`danger`→红 · `important`→青。

---

## 造型语言

| 场景          | 规则                                                               |
| ------------- | ------------------------------------------------------------------ |
| Demo 入口     | 可用纸色底、实心墨线、光谱条 — 品牌展示面                          |
| 编辑器        | **安静优先**：浅底 `#fafaf8` / 白 elevated；细边框；品牌色只做强调 |
| 描边          | 编辑器 chrome **禁止** 2px 实心墨线 + 硬偏移阴影（太抢视线）       |
| 主按钮 / 链接 | 品牌蓝 `#008dee`                                                   |
| 语义色        | Alert 等用光谱色，但不要把整页铺成纸色海报                         |

---

## default 落地

| 层     | 文件                                         | 做什么                                |
| ------ | -------------------------------------------- | ------------------------------------- |
| 色板   | `src/theme/style/common/_tokens.scss`        | brand / 语义 = Logo；bg 用浅暖白      |
| chrome | `src/theme/style/common/_default-brand.scss` | 仅清底 + 链接色，**不加粗描边**       |
| Demo   | `demo/home.scss`                             | 可用 `$penna-logo-paper` 做展示向视觉 |

仍不需要额外 `penna-theme-default-*.css`。

---

## 反例（禁止）

- 樱桃红 / 旧青灰 `#5086a1` 冒充品牌色
- 在编辑器工具栏 / 对话框 / 卡片上堆 logo 同款粗描边硬阴影
- Demo 与 tokens 各写一套 hex
- 整页浓纸色 `#edebe7` 当编辑器默认底（Demo 可以，编辑器不行）
- 紫色光晕、多层柔阴影、全圆角 pill

---

## 相关

- [主题](themes.md) · [快速开始](getting-started.md) · Logo：`logo/`
