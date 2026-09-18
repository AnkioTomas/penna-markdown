/**
 * @file 公式 / Mermaid / ECharts：远程换肤 + 本地引擎水合
 * @module renderer/graph/graph
 */

import {
  base64UrlDecode,
  buildMermaidImageSrc,
  parseEchartsJson,
} from "@/transformer/extends/block/specialCode.js";

const H = "data-penna-hydrated";

/** 宿主传入的库；缺哪个仍走远程 API */
export interface GraphEngines {
  math?: {
    renderToString(
      tex: string,
      options?: { displayMode?: boolean; throwOnError?: boolean },
    ): string;
  };
  mermaid?: {
    initialize?(config: Record<string, unknown>): void;
    render(id: string, text: string): Promise<{ svg: string }>;
  };
  echarts?: {
    init(
      el: HTMLElement,
      theme?: string | object | null,
    ): { setOption(option: Record<string, unknown>): void; dispose(): void };
  };
}

type Chart = { dispose(): void };

/** 远程 API：改 `<img src>` 主题参数 */
export function replaceGraph(container: HTMLElement, dark: boolean): void {
  const theme = dark ? ("dark" as const) : undefined;

  for (const node of container.querySelectorAll(
    ".penna-math-latex[data-latex]",
  )) {
    if (!(node instanceof HTMLImageElement)) continue;
    node.src = node.src.replace(
      dark ? "color=black" : "color=white",
      dark ? "color=white" : "color=black",
    );
  }

  for (const node of container.querySelectorAll(
    ".penna-mermaid__img[data-mermaid]",
  )) {
    if (!(node instanceof HTMLImageElement)) continue;
    const code = base64UrlDecode(node.getAttribute("data-mermaid") ?? "");
    const src = buildMermaidImageSrc(code, { theme });
    if (src && node.src !== src) node.src = src;
  }

  for (const node of container.querySelectorAll(
    ".penna-echarts__img[data-echarts]",
  )) {
    if (!(node instanceof HTMLImageElement)) continue;
    node.src = dark
      ? node.src.replace("theme%22%3A%22%22", "theme%22%3A%22dark%22")
      : node.src.replace("theme%22%3A%22dark%22", "theme%22%3A%22%22");
  }
}

/** destroy 时卸掉还连着的 ECharts 实例 */
export function disposeCharts(container: HTMLElement): void {
  for (const node of container.querySelectorAll(".penna-echarts__canvas")) {
    (node as HTMLElement & { _pennaChart?: Chart })._pennaChart?.dispose();
  }
}

/** 渲染后调用；已水合节点跳过。主题切换靠下次 render（Preview/demo 已重渲）。 */
export function hydrateGraphs(
  container: HTMLElement,
  engines: GraphEngines | undefined,
  dark: boolean,
): void {
  if (!engines) return;
  const doc = container.ownerDocument;

  if (engines.math) {
    for (const node of container.querySelectorAll(
      `.penna-math-latex[data-latex]:not([${H}])`,
    )) {
      const el = node as HTMLElement;
      const latex = el.getAttribute("data-latex") ?? "";
      if (!latex) continue;
      const inline = el.getAttribute("data-inline") === "true";
      try {
        const html = engines.math.renderToString(latex, {
          displayMode: !inline,
          throwOnError: false,
        });
        const wrap = doc.createElement(inline ? "span" : "div");
        wrap.className = "penna-math-latex";
        wrap.setAttribute("data-latex", latex);
        wrap.setAttribute("data-inline", String(inline));
        wrap.setAttribute(H, "math");
        wrap.innerHTML = html;
        el.replaceWith(wrap);
      } catch {
        /* keep placeholder */
      }
    }
  }

  if (engines.echarts) {
    for (const node of container.querySelectorAll(
      `.penna-echarts__img[data-echarts]:not([${H}])`,
    )) {
      const el = node as HTMLElement;
      const payload = el.getAttribute("data-echarts") ?? "";
      const host = doc.createElement("div") as HTMLElement & {
        _pennaChart?: Chart;
      };
      host.className = "penna-echarts__img penna-echarts__canvas";
      host.setAttribute("data-echarts", payload);
      host.setAttribute(H, "echarts");
      host.style.cssText = "width:100%;max-width:100%;height:400px";
      el.replaceWith(host);
      try {
        const chart = engines.echarts.init(host, dark ? "dark" : undefined);
        chart.setOption({
          ...parseEchartsJson(base64UrlDecode(payload).trim()),
          animation: false,
        });
        host._pennaChart = chart;
      } catch {
        /* empty */
      }
    }
  }

  if (engines.mermaid) {
    const mermaid = engines.mermaid;
    mermaid.initialize?.({
      startOnLoad: false,
      theme: dark ? "dark" : "default",
    });
    let seq = 0;
    void (async () => {
      for (const node of [
        ...container.querySelectorAll(
          `.penna-mermaid__img[data-mermaid]:not([${H}])`,
        ),
      ] as HTMLElement[]) {
        if (!node.isConnected) return;
        const payload = node.getAttribute("data-mermaid") ?? "";
        const code = base64UrlDecode(payload).trim();
        if (!code) continue;
        try {
          const { svg } = await mermaid.render(`penna-mmd-${seq++}`, code);
          if (!node.isConnected) return;
          const host = doc.createElement("div");
          host.className = "penna-mermaid__img penna-mermaid__svg";
          host.setAttribute("data-mermaid", payload);
          host.setAttribute(H, "mermaid");
          host.innerHTML = svg;
          node.replaceWith(host);
        } catch {
          /* keep */
        }
      }
    })();
  }
}
