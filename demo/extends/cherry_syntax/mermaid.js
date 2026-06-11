/** @type {import('../syntaxExample.js').SyntaxExample} */
export default {
  name: "mermaid",
  desc: "Mermaid 图表 ```mermaid",
  markdown: `## 流程图（flowchart）

\`\`\`mermaid
flowchart TD
    A[开始] --> B{是否通过?}
    B -->|是| C[处理业务]
    B -->|否| D[结束]
    C --> D
\`\`\`

## 时序图（sequenceDiagram）

\`\`\`mermaid
sequenceDiagram
    participant U as 用户
    participant S as 服务端
    U->>S: 请求数据
    S-->>U: 返回 JSON
\`\`\`

## 状态图（stateDiagram）

\`\`\`mermaid
stateDiagram-v2
    [*] --> 草稿
    草稿 --> 已发布: 发布
    已发布 --> 已归档: 归档
    已归档 --> [*]
\`\`\`

## 别名：\`\`\`graph

与 \`\`\`mermaid 等价，兼容旧写法。

\`\`\`graph
flowchart LR
    输入 --> 解析 --> 渲染
\`\`\``,
};
