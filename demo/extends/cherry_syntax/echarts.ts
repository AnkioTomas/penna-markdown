import type { SyntaxExample } from '../../syntax-example.js';
const example = {
  name: "echarts",
  desc: "ECharts 图表 ```echarts",
  markdown: `## 柱状图

\`\`\`echarts
{
  "title": { "text": "月度访问" },
  "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "bar", "data": [120, 200, 150, 80, 70] }]
}
\`\`\`

## 饼图

\`\`\`echarts
{
  "title": { "text": "占比", "left": "center" },
  "series": [{
    "type": "pie",
    "radius": "55%",
    "data": [
      { "value": 40, "name": "A" },
      { "value": 32, "name": "B" },
      { "value": 28, "name": "C" }
    ]
  }]
}
\`\`\`

## 折线图

\`\`\`echarts
{
  "title": { "text": "趋势" },
  "tooltip": { "trigger": "axis" },
  "xAxis": { "type": "category", "data": ["Q1", "Q2", "Q3", "Q4"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "line", "smooth": true, "data": [12, 18, 15, 22] }]
}
\`\`\`

配置体为标准 JSON；渲染为远程图片，随系统深浅色切换主题。`,
} satisfies SyntaxExample;

export default example;
