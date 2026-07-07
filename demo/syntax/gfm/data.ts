export interface SyntaxDemoItem {
  id: string;
  name: string;
  markdown: string;
}

export const SYNTAX_DATA: SyntaxDemoItem[] = [
  {
    id: "heading",
    name: "标题 (Heading)",
    markdown: `### ATX 标题（# 语法）

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

### Setext 标题（下划线语法）

Setext 风格一级标题
=================

Setext 风格二级标题
-----------------

### 标题内嵌行内格式

标题中可以包含 **加粗**、*斜体*、[链接](https://github.com) 和 \`行内代码\`。`,
  },
  {
    id: "emphasis",
    name: "强调与删除线 (Emphasis)",
    markdown: `### 基础强调

**使用星号的加粗** 与 __使用下划线的加粗__

*使用星号的斜体* 与 _使用下划线的斜体_

***使用星号的加粗斜体*** 与 ___使用下划线的加粗斜体___

~~删除线文本~~

### 嵌套与组合

**加粗文本中包含 *斜体* 部分**

*斜体文本中包含 **加粗** 部分*

### 词内强调 (Intra-word)

un*frigging*believable、**bold**ness

### 转义

\\*不斜体\\*、\\*\\*不粗体\\*\\*、\\~不删除\\~

### 强调与标点

在标点符号旁的强调同样有效：**粗体**，*斜体*。`,
  },
  {
    id: "hr",
    name: "水平线 (Hr)",
    markdown: `### 使用连字符

---

### 使用星号

***

### 使用下划线

___

### 带有空格的水平线

- - -

* * *`,
  },
  {
    id: "blockquote",
    name: "引用 (Blockquote)",
    markdown: `### 基础引用

> 这是一个基础的引用段落。
> 它可以包含多行文本，只需在每行前加上大于号。
>
> 即使有空行也能连贯。

### 嵌套引用

> 最外层引用。
> > 第一层嵌套。
> > > 第二层嵌套。
> > 返回第一层。
>
> 返回最外层。

### 引用内包含其他元素

> 引用中也可以使用其他 Markdown 元素：
> - **加粗** 和 *斜体*
> - 列表项 1
> - 列表项 2
>
> \`\`\`javascript
> console.log('引用内的代码块');
> \`\`\``,
  },
  {
    id: "list",
    name: "列表 (List)",
    markdown: `### 无序列表

* 星号列表项
* 星号列表项
- 减号列表项
- 减号列表项
+ 加号列表项
+ 加号列表项

### 有序列表

1. 第一步
2. 第二步
3. 第三步
   1. 嵌套 3.1
   2. 嵌套 3.2
10. 即使数字不连续也会自动修正

### 嵌套列表与混合列表

* 前端技术
  * HTML
    * 语义化标签
  * CSS
  * JavaScript
    1. ES6
    2. ESNext
* 后端技术
  1. Node.js
  2. Python

### 松散列表（项间空行）

- 第一项

  这是第一项下的段落，不是新列表项。

- 第二项

  - 嵌套子项

### 包含段落的列表项

* 列表项 A

  列表项 A 的第二段说明文字。

* 列表项 B

  > 列表项 B 内嵌套的引用。`,
  },
  {
    id: "code",
    name: "代码 (Code)",
    markdown: `### 行内代码

这是基础的 \`行内代码\` 示例。如果代码本身包含反引号，可以使用双反引号包裹：\`\` \`code\` \`\`。

三个反引号转义：\`\`\`三个反引号\`\`\`

### Fenced 围栏代码块

\`\`\`javascript
// JavaScript 示例
function calculateTotal(items) {
  return items.reduce((acc, item) => acc + item.price, 0);
}
\`\`\`

\`\`\`css
/* CSS 示例 */
.cherry-render {
  color: #333;
  background: #f9f9f9;
}
\`\`\`

\`\`\`bash
pnpm install cherry-markdown-next
pnpm dev
\`\`\`

### 不指定语言的代码块

\`\`\`
Plain text block without language specific highlighting.
Line 2.
\`\`\`

### 缩进代码块

    // 只要缩进四个空格，就会被识别为代码块
    const test = "indent block";
    console.log(test);`,
  },
  {
    id: "table",
    name: "表格 (Table)",
    markdown: `### 基础对齐方式

| 默认对齐 | 左对齐 | 居中对齐 | 右对齐 |
| --- | :--- | :---: | ---: |
| Cell 1 | Cell 2 | Cell 3 | Cell 4 |
| 文本 | 长一点的文本 | 短文本 | 最长的文本测试 |

### 包含格式的表格

| 特性 | 描述 | 状态 |
| --- | --- | :---: |
| **加粗** | *斜体描述* | ~~废弃~~ |
| \`代码\` | [文档链接](#) | 正常 |
| 转义管道符 \\| | 包含 HTML <br> 换行 | 正常 |

### 缺失单元格或多出单元格容错

| A | B | C |
| --- | --- | --- |
| 只有一列 |
| 1 | 2 | 3 | 4 | 5 |`,
  },
  {
    id: "link",
    name: "链接 (Link)",
    markdown: `### 内联链接

[Cherry Markdown 官网](https://github.com/Tencent/cherry-markdown)

带 title 的链接：[悬停查看标题](https://github.com "这是一个标题内容")

[相对路径](./index.html)

### 自动链接

邮箱：<test@example.com>

网址：<https://github.com/Tencent/cherry-markdown>

### 引用式链接

你可以像这样写[引用链接 1][id1] 和 [引用链接 2][id2]。

[id1]: https://google.com "Google"
[id2]: https://bing.com "Bing"

### 嵌套与优先级

嵌套链接：[foo [bar](https://example.com/bar)](https://example.com/foo)

链接 vs 强调：*[foo*](https://example.com)`,
  },
  {
    id: "image",
    name: "图片 (Image)",
    markdown: `### 行内图片

![随机图片](https://picsum.photos/300/150)

带 Title 的图片：

![带 Title 提示](https://picsum.photos/300/150 "悬停可见")

### 带链接的图片

[![可点击的图片](https://picsum.photos/300/150)](https://github.com)

### 引用式图片

![引用图][img-ref]

[img-ref]: https://picsum.photos/240/160 "引用 title"`,
  },
  {
    id: "html",
    name: "HTML 与实体 (HTML & Entity)",
    markdown: `### 原生 HTML 块

<div style="padding: 10px; border: 1px solid #ccc; background: #fdfdfd; border-radius: 6px;">
  <h4 style="color: #2563eb; margin-top: 0;">HTML 面板</h4>
  <p>Markdown 支持直接混编 HTML。</p>
  <ul>
    <li>原生列表项 1</li>
    <li>原生列表项 2</li>
  </ul>
</div>

### 行内 HTML

这是一段包含 <span style="color: red; font-weight: bold;">红色高亮</span>、<u>下划线</u>、<kbd>Ctrl</kbd> + <kbd>C</kbd> 的混合文本。

<!-- HTML 注释不会出现在渲染输出中 -->

### HTML 实体字符

版权符号：&copy;
注册商标：&reg;
数学符号：&sum; &int; &infin;
HTML 转义：&lt;div&gt; &amp; &quot; &nbsp; &hellip;`,
  },
  {
    id: "paragraph",
    name: "段落与换行 (Paragraph)",
    markdown: `### 段落

这是第一段文本。段落之间需要有一个空行分隔。

这是第二段文本。如果没有空行，它们会被合并在同一个段落中。
这是紧接着的一行（由于没有硬换行，这里可能被解析在同一行或渲染为一个空格）。

### 硬换行 (Hard Break)

使用反斜杠来进行硬换行：\\
这是新的一行。

或者在行尾添加两个以上的空格来进行硬换行：
这也是新的一行。

强调内换行：*foo\\
bar*`,
  },
];
