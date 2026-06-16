import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "html",
  desc: "原始 HTML 块与行内标签",
  markdown: `<div class="note">
  <p>块级 HTML 段落</p>
</div>

段落中含 <kbd>Ctrl</kbd> + <kbd>C</kbd> 行内标签。

<!-- HTML 注释不会出现在输出中 -->`,
} satisfies SyntaxExample;

export default example;
