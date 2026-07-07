import "../../_common/layout.scss";
import "@/theme/style/transformer.scss"; // 仅引入默认渲染主题
import { Renderer } from "@/renderer/Renderer.js";
import { Theme } from "@/theme/Theme.js";

const SYNTAX_DATA = [
  {
    id: "heading",
    name: "标题 (Heading)",
    markdown: `# 一级标题\n## 二级标题\n### 三级标题\n#### 四级标题\n##### 五级标题\n###### 六级标题\n\nSetext 风格一级标题\n=================\n\nSetext 风格二级标题\n-----------------\n\n### 标题内嵌格式\n标题中可以包含 **加粗**、*斜体* 以及 [链接](https://github.com) 和 \`行内代码\`。`
  },
  {
    id: "emphasis",
    name: "强调 (Emphasis)",
    markdown: `### 1. 基础强调\n**使用星号的加粗文本** 与 __使用下划线的加粗文本__\n\n*使用星号的斜体文本* 与 _使用下划线的斜体文本_\n\n***使用星号的加粗斜体*** 与 ___使用下划线的加粗斜体___\n\n~~删除线文本~~\n\n### 2. 嵌套与组合\n**加粗文本中包含 *斜体* 部分**\n*斜体文本中包含 **加粗** 部分*\n\n### 3. 强调与标点\n在标点符号旁的强调同样有效：**粗体**，*斜体*。`
  },
  {
    id: "hr",
    name: "水平线 (Hr)",
    markdown: `### 1. 使用连字符\n---\n\n### 2. 使用星号\n***\n\n### 3. 使用下划线\n___\n\n### 4. 带有空格的水平线\n- - -\n\n* * *`
  },
  {
    id: "blockquote",
    name: "引用 (Blockquote)",
    markdown: `### 1. 基础引用\n> 这是一个基础的引用段落。\n> 它可以包含多行文本，只需在每行前加上大于号。\n>\n> 即使有空行也能连贯。\n\n### 2. 嵌套引用\n> 最外层引用。\n> > 第一层嵌套。\n> > > 第二层嵌套。\n> > 返回第一层。\n> \n> 返回最外层。\n\n### 3. 引用内包含其他元素\n> 引用中也可以使用其他 Markdown 元素：\n> - **加粗** 和 *斜体*\n> - 列表项 1\n> - 列表项 2\n>\n> \`\`\`javascript\n> console.log('引用内的代码块');\n> \`\`\``
  },
  {
    id: "list",
    name: "列表 (List)",
    markdown: `### 1. 无序列表\n* 星号列表项\n* 星号列表项\n- 减号列表项\n- 减号列表项\n+ 加号列表项\n+ 加号列表项\n\n### 2. 有序列表\n1. 第一步\n2. 第二步\n3. 第三步\n10. 即使数字不连续也会自动修正\n\n### 3. 嵌套列表与混合列表\n* 前端技术\n  * HTML\n    * 语义化标签\n  * CSS\n  * JavaScript\n    1. ES6\n    2. ESNext\n* 后端技术\n  1. Node.js\n  2. Python\n\n### 4. 包含段落的列表项\n* 列表项 A\n  \n  列表项 A 的第二段说明文字。\n\n* 列表项 B\n  \n  > 列表项 B 内嵌套的引用。`
  },
  {
    id: "code",
    name: "代码 (Code)",
    markdown: `### 1. 行内代码\n这是基础的 \`行内代码\` 示例。如果代码本身包含反引号，可以使用双反引号包裹：\`\` \`code\` \`\`。\n\n### 2. Fenced 代码块 (围栏代码块)\n\`\`\`javascript\n// JavaScript 示例\nfunction calculateTotal(items) {\n  return items.reduce((acc, item) => acc + item.price, 0);\n}\n\`\`\`\n\n\`\`\`css\n/* CSS 示例 */\n.cherry-render {\n  color: #333;\n  background: #f9f9f9;\n}\n\`\`\`\n\n### 3. 不指定语言的代码块\n\`\`\`\nPlain text block without language specific highlighting.\nLine 2.\n\`\`\`\n\n### 4. 缩进代码块\n    // 只要缩进四个空格，就会被识别为代码块\n    const test = \"indent block\";\n    console.log(test);`
  },
  {
    id: "table",
    name: "表格 (Table)",
    markdown: `### 1. 基础对齐方式\n| 默认对齐 | 左对齐 | 居中对齐 | 右对齐 |\n| --- | :--- | :---: | ---: |\n| Cell 1 | Cell 2 | Cell 3 | Cell 4 |\n| 文本 | 长一点的文本 | 短文本 | 最长的文本测试 |\n\n### 2. 包含格式的表格\n| 特性 | 描述 | 状态 |\n| --- | --- | :---: |\n| **加粗** | *斜体描述* | ~~废弃~~ |\n| \`代码\` | [文档链接](#) | 正常 |\n| 转义管道符 \\| | 包含 HTML <br> 换行 | 正常 |\n\n### 3. 缺失单元格或多出单元格容错\n| A | B | C |\n| --- | --- | --- |\n| 只有一列 |\n| 1 | 2 | 3 | 4 | 5 |`
  },
  {
    id: "link",
    name: "链接与图片 (Link & Image)",
    markdown: `### 1. 基础链接\n[Cherry Markdown 官网](https://github.com/Tencent/cherry-markdown)\n\n带 title 的链接：[悬停查看标题](https://github.com "这是一个标题内容")\n\n### 2. 自动链接\n邮箱：<test@example.com>\n网址：<https://github.com/Tencent/cherry-markdown>\n\n### 3. 引用链接\n你可以像这样写[引用链接 1][id1] 和 [引用链接 2][id2]。\n\n[id1]: https://google.com "Google"\n[id2]: https://bing.com "Bing"\n\n### 4. 图片\n基础图片：\n![随机图片](https://picsum.photos/300/150)\n\n带 Title 的图片：\n![带 Title 提示](https://picsum.photos/300/150 "悬停可见")\n\n带链接的图片：\n[![可点击的图片](https://picsum.photos/300/150)](https://github.com)`
  },
  {
    id: "html",
    name: "HTML 与实体 (HTML & Entity)",
    markdown: `### 1. 原生 HTML 块\n<div style="padding: 10px; border: 1px solid #ccc; background: #fdfdfd;">\n  <h4 style="color: #2563eb; margin-top: 0;">HTML 面板</h4>\n  <p>Markdown 支持直接混编 HTML。</p>\n  <ul>\n    <li>原生列表项 1</li>\n    <li>原生列表项 2</li>\n  </ul>\n</div>\n\n### 2. 行内 HTML\n这是一段包含 <span style="color: red; font-weight: bold;">红色高亮</span> 和 <u>下划线</u> 的混合文本。\n\n### 3. HTML 实体字符\n版权符号：&copy;\n注册商标：&reg;\n数学符号：&sum; &int; &infin;\nHTML 转义：&lt;div&gt; &amp; &quot;`
  },
  {
    id: "paragraph",
    name: "段落与换行 (Paragraph)",
    markdown: `### 1. 段落\n这是第一段文本。段落之间需要有一个空行分隔。\n\n这是第二段文本。如果没有空行，它们会被合并在同一个段落中。\n这是紧接着的一行（由于没有硬换行，这里可能被解析在同一行或渲染为一个空格）。\n\n### 2. 硬换行 (Hard Break)\n使用反斜杠来进行硬换行：\\\n这是新的一行。\n\n或者在行尾添加两个以上的空格来进行硬换行：  \n这也是新的一行。`
  }
];

async function init() {
  const menuList = document.getElementById("menu-list")!!;
  const sourcePreview = document.getElementById("source-preview")!!;
  const htmlPreview = document.getElementById("html-preview")!!;
  const renderer = new Renderer({ mount: htmlPreview, theme: new Theme() });

  let activeId = SYNTAX_DATA[0].id;

  function renderMenu() {
    menuList.innerHTML = "";
    SYNTAX_DATA.forEach(item => {
      const el = document.createElement("div");
      el.className = `menu-item ${item.id === activeId ? "active" : ""}`;
      el.textContent = item.name;
      el.addEventListener("click", () => {
        activeId = item.id;
        renderMenu();
        renderContent();
      });
      menuList.appendChild(el);
    });
  }

  function renderContent() {
    const item = SYNTAX_DATA.find(i => i.id === activeId);
    if (item) {
      sourcePreview.textContent = item.markdown;
      renderer.render(item.markdown);
    }
  }

  renderMenu();
  renderContent();
}

init();
