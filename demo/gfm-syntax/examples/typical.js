/** @type {import('../../extends/syntaxExample.js').SyntaxExample} */
export default {
  name: "typical",
  desc: "典型语法：标题、强调、链接、列表、引用、代码、表格",
  markdown: `# 标题

段落与 **加粗**、*斜体*、~~删除线~~。

[链接](https://example.com) 与 ![图片](https://example.com/a.png)

- 无序列表
- 第二项

1. 有序列表
2. 第二项

> 引用块

\`inline code\`

\`\`\`js
console.log('block')
\`\`\`

| 表头 | 值 |
| --- | --- |
| A | 1 |

---

自动链接 <https://example.com>
`,
  expected: `<h1>标题</h1>
<p>段落与 <strong>加粗</strong>、<em>斜体</em>、<del>删除线</del>。</p>
<p><a href="https://example.com">链接</a> 与 <img src="https://example.com/a.png" alt="图片" /></p>
<ul>
<li>无序列表</li>
<li>第二项</li>
</ul>
<ol>
<li>有序列表</li>
<li>第二项</li>
</ol>
<blockquote>
<p>引用块</p>
</blockquote>
<p><code>inline code</code></p>
<pre><code class="language-js">console.log('block')
</code></pre>
<table>
<thead>
<tr>
<th>表头</th>
<th>值</th>
</tr>
</thead>
<tbody>
<tr>
<td>A</td>
<td>1</td>
</tr>
</tbody>
</table>
<hr />
<p>自动链接 <a href="https://example.com">https://example.com</a></p>
`,
};
