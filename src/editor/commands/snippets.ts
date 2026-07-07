/** 与 Transformer / docs/simple.md 对齐的插入模板 */

export type AlertKind = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

export function alertBlock(kind: AlertKind, body = "提示内容"): string {
  return `> [!${kind}]\n> ${body}\n`;
}

export function containerBlock(
  type: string,
  title: string,
  body = "容器内容",
): string {
  const head = title ? `::: ${type} ${title}` : `::: ${type}`;
  return `${head}\n${body}\n:::\n`;
}

export function tripleColonBlock(open: string, body: string): string {
  return `::: ${open}\n${body}\n:::\n`;
}

export function quadColonBlock(open: string, body: string, close = ""): string {
  return `:::: ${open}\n${body}${close ? `\n${close}` : ""}\n::::\n`;
}

export const SNIPPETS = {
  collapse: tripleColonBlock("collapse accordion", "- 面板标题\n\n  面板内容"),
  tabs: tripleColonBlock(
    "tabs",
    "@tab 标签 A\nTab A 内容\n@tab 标签 B\nTab B 内容",
  ),
  steps: tripleColonBlock(
    "steps",
    "\n1. 步骤一\n\n   步骤说明\n\n2. 步骤二\n\n   步骤说明\n",
  ),
  timeline: tripleColonBlock(
    "timeline",
    "- 里程碑\n  time=2024-01 type=success\n\n  事件说明",
  ),
  card: tripleColonBlock("card 卡片标题", "卡片正文"),
  linkCard: tripleColonBlock(
    'link-card 链接标题 link="https://example.com"',
    "链接卡片描述",
  ),
  imageCard: tripleColonBlock(
    'image-card image="https://example.com/image.jpg" title="图片标题"',
    "图片卡片描述",
  ),
  repoCard: tripleColonBlock("repo-card owner/repo", "仓库描述"),
  cardGrid: quadColonBlock(
    'card-grid cols="{ sm: 1, md: 2 }"',
    "::: card 网格项\n网格内容\n:::",
  ),
  cardMasonry: quadColonBlock(
    'card-masonry cols="3" gap="12"',
    "![描述](https://example.com/image.jpg)",
  ),
  field: tripleColonBlock(
    "field fieldName",
    "@type string\n@required\n字段说明",
  ),
  fieldGroup: quadColonBlock(
    "field-group",
    "::: field name\n@type string\n字段说明\n:::",
  ),
  mathBlock: "$$\nE = mc^2\n$$\n",
  commentBlock: "%%%\n注释\n%%%\n",
  frontmatter: "---\ntitle: 标题\ndescription: 描述\n---\n\n",
  mermaid: "```mermaid\nflowchart LR\n  A[开始] --> B[结束]\n```\n",
  mermaidFlowchart:
    "```mermaid\nflowchart TD\n  A[开始] --> B{判断}\n  B -->|是| C[结束]\n```\n",
  mermaidSequence:
    "```mermaid\nsequenceDiagram\n  participant A as 用户\n  participant B as 系统\n  A->>B: 请求\n  B-->>A: 响应\n```\n",
  mermaidClass:
    "```mermaid\nclassDiagram\n  Animal <|-- Duck\n  Animal : +int age\n```\n",
  mermaidState:
    "```mermaid\nstateDiagram-v2\n  [*] --> Still\n  Still --> Moving\n```\n",
  mermaidPie:
    '```mermaid\npie title 占比\n  "A" : 45\n  "B" : 30\n  "C" : 25\n```\n',
  mermaidGantt:
    "```mermaid\ngantt\n  title 计划\n  section 阶段\n  任务A :a1, 2024-01-01, 7d\n```\n",
  echarts:
    '```echarts\n{\n  "xAxis": { "type": "category", "data": ["A", "B", "C"] },\n  "yAxis": { "type": "value" },\n  "series": [{ "type": "bar", "data": [12, 20, 15] }]\n}\n```\n',
  echartsLine:
    '```echarts\n{\n  "xAxis": { "type": "category", "data": ["一", "二", "三"] },\n  "yAxis": { "type": "value" },\n  "series": [{ "type": "line", "data": [12, 18, 9] }]\n}\n```\n',
  echartsPie:
    '```echarts\n{\n  "series": [{ "type": "pie", "radius": "60%", "data": [{ "value": 40, "name": "A" }, { "value": 32, "name": "B" }] }]\n}\n```\n',
  enhancedCode:
    '```javascript title="example.js"\nconsole.log("hello");\n```\n',
  video: "!video[视频标题](https://example.com/video.mp4)\n",
  audio: "!audio[音频标题](https://example.com/audio.mp3)\n",
  iframe: "!iframe[嵌入标题](https://example.com)\n",
  footnoteRef: "[^1]",
  footnoteDef: "\n[^1]: 脚注定义内容\n",
  emoji: ":smile:",
  taskInProgress: "- [/] 进行中\n",
  taskDeferred: "- [>] 延期\n",
  taskEarly: "- [<] 提前\n",
  taskCancelled: "- [-] 已取消\n",
  taskUrgent: "- [!] 紧急\n",
} as const;
