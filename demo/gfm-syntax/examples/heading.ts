import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "heading",
  desc: "ATX 标题 # ~ ######",
  markdown: `# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题`,
} satisfies SyntaxExample;

export default example;
