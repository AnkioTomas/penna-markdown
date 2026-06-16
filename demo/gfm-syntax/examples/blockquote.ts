import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "blockquote",
  desc: "引用块 > quote",
  markdown: `> 单行引用

> 多行引用
> 第二行
>
> 空行后的段落

> 嵌套引用
>> 第二层
>>> 第三层`,
} satisfies SyntaxExample;

export default example;
