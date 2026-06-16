import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "strikethrough",
  desc: "删除线 ~~text~~",
  markdown: `~~已删除的内容~~

可与强调组合：~~**粗体删除**~~、~~*斜体删除*~~`,
} satisfies SyntaxExample;

export default example;
