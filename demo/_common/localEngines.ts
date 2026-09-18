/**
 * Demo 专用：按需加载本地图表引擎（不进 npm 运行时包）。
 */
import type { GraphEngines } from "@/renderer/graph/graph.js";

let cached: Promise<GraphEngines> | null = null;

/** 懒加载 KaTeX / Mermaid / ECharts，结果缓存。 */
export function loadLocalEngines(): Promise<GraphEngines> {
  cached ??= (async () => {
    const [{ default: katex }, mermaidMod, echarts] = await Promise.all([
      import("katex"),
      import("mermaid"),
      import("echarts"),
    ]);
    await import("katex/dist/katex.min.css");
    const mermaid = mermaidMod.default;
    mermaid.initialize({ startOnLoad: false });
    return { math: katex, mermaid, echarts };
  })();
  return cached;
}

/** 本地引擎演示用短样例（公式 / Mermaid / ECharts 一眼可见） */
export const LOCAL_ENGINES_SAMPLE = `# 本地引擎渲染

本页切换到 **本地引擎** 后，公式 / Mermaid / ECharts 由宿主传入的 JS 库水合，**不请求**远程 API。

对比：选「远程 API」时，同样语法会生成 \`<img src="https://…">\`。

## 行内公式

欧拉恒等式 $e^{i\\pi}+1=0$，空间 $\\mathbb{R}^2$。

## 块级公式

$$
\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
$$

## Mermaid

\`\`\`mermaid
flowchart LR
  MD[Markdown] --> T[Transformer]
  T --> Q{engines?}
  Q -->|有| L[本地水合]
  Q -->|无| R[远程 API 图]
\`\`\`

## ECharts

\`\`\`echarts
{
  title: { text: "本地 ECharts" },
  tooltip: {},
  xAxis: { type: "category", data: ["A", "B", "C", "D"] },
  yAxis: { type: "value" },
  series: [{ type: "bar", data: [12, 24, 18, 32] }]
}
\`\`\`
`;
