整条链路只有四段，中间没有虚拟 DOM，也没有中间态字符串缓存。

```mermaid max-width=560
flowchart LR
  MD[Markdown] --> P[Parser]
  P --> AST[块级 AST]
  AST --> R[Renderer]
  R --> DOM[预览 DOM]
  DOM -. data-hash .-> R
```

::: steps

1. **切块**：按行扫描，产出顶层块节点，每块记录 `startLine` / `endLine`

2. **求 hash**：块内容 + 渲染依赖一起参与哈希，作为复用凭据

```ts
const hash = hashBlock(node, store);
```

3. **对齐 DOM**：命中 hash 就复用旧节点，否则渲染新节点

4. **写回索引**：块索引与 `mount.children` 严格一一对应

:::

::: note 📘 为什么要记录行号
滚动同步需要「源码行 ↔ 预览块」的双向映射；
行号写在块索引里，编辑器侧不需要再扫一遍文档。
:::

想看真实结构，把文档丢进 **AST 语法树** Demo，展开的就是这里说的块节点。
