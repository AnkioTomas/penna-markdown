/**
 * @file 外部图表库水合器
 * @module renderer/graph/GraphHydrator
 *
 * transformer 输出的占位节点（`img.penna-math-latex` / `.penna-mermaid__img` /
 * `.penna-echarts__img`）在渲染后由本模块替换成本地库的产物。
 *
 * - 已水合节点带 `data-penna-hydrated`，不会重复处理；增量 reconcile 复用节点时水合结果随之保留
 * - 结果按「源码 + 主题」缓存，流式重渲重建节点时直接恢复，不闪烁
 * - 每次 {@link reset} 递增 generation，过期的异步结果被丢弃
 * - Mermaid 串行渲染（库本身不可并发）；失败回退为源码，不留残余节点
 */

import {
  resolveEngine,
  type EngineKind,
  type EngineTypes,
  type GraphEngines,
} from "@/renderer/graph/engines";
import {
  base64UrlDecode,
  parseEchartsJson,
} from "@/transformer/extends/block/specialCode.js";

const H = "data-penna-hydrated";
const CACHE_LIMIT = 200;
const ECHARTS_HEIGHT = "400px";

type Chart = { dispose(): void; resize?(): void };
type ChartHost = HTMLElement & { _pennaChart?: Chart };

let mermaidSeq = 0;

function lruSet(map: Map<string, string>, key: string, value: string): void {
  map.delete(key);
  map.set(key, value);
  if (map.size > CACHE_LIMIT) map.delete(map.keys().next().value as string);
}

export class GraphHydrator {
  private engines: GraphEngines = {};
  private readonly resolved = new Map<EngineKind, Promise<unknown>>();
  private readonly cache = new Map<string, string>();
  private readonly charts = new Set<Chart>();
  private mermaidQueue: Promise<void> = Promise.resolve();
  private generation = 0;
  private dark = false;

  constructor(private readonly mount: HTMLElement) {}

  /** 该类图表是否由本地库接管（决定 transformer 是否省掉远程 src） */
  has(kind: EngineKind): boolean {
    return this.engines[kind] !== undefined;
  }

  /** 替换引擎配置；调用方负责随后重渲 */
  setEngines(engines: GraphEngines | undefined): void {
    this.reset();
    this.engines = { ...engines };
    this.resolved.clear();
    this.cache.clear();
  }

  /** 使在途异步任务失效并卸掉所有 ECharts 实例 */
  private invalidate(): void {
    this.generation++;
    for (const n of this.mount.querySelectorAll(`[${H}="pending"]`)) {
      n.removeAttribute(H);
    }
  }

  private reset(): void {
    this.invalidate();
    for (const c of this.charts) c.dispose();
    this.charts.clear();
  }

  destroy(): void {
    this.reset();
    this.engines = {};
  }

  /** 主题切换：Mermaid / ECharts 还原为占位后按新主题重新水合；KaTeX 继承文字色，无需处理 */
  retheme(dark: boolean): void {
    if (dark === this.dark) return;
    this.dark = dark;
    const doc = this.mount.ownerDocument;
    this.invalidate();
    if (this.has("echarts")) {
      for (const c of this.charts) c.dispose();
      this.charts.clear();
      this.restore(
        doc,
        ".penna-echarts__canvas",
        "penna-echarts__img",
        "data-echarts",
      );
    }
    if (this.has("mermaid")) {
      this.restore(
        doc,
        ".penna-mermaid__svg",
        "penna-mermaid__img",
        "data-mermaid",
      );
    }
    this.hydrate(dark);
  }

  private restore(
    doc: Document,
    selector: string,
    cls: string,
    attr: string,
  ): void {
    for (const node of this.mount.querySelectorAll(`${selector}[${H}]`)) {
      const img = doc.createElement("img");
      img.className = cls;
      img.setAttribute(attr, node.getAttribute(attr) ?? "");
      node.replaceWith(img);
    }
  }

  /**
   * 渲染后调用：处理所有尚未水合的占位节点。
   *
   * 没有待水合节点的引擎不碰：`engine()` 第一次调用会触发加载函数，
   * 文档里没有 mermaid 就不该把几 MB 的 mermaid 下下来。
   */
  hydrate(dark: boolean): void {
    this.dark = dark;
    this.disposeDetached();
    for (const kind of ["math", "echarts", "mermaid"] as const) {
      if (!this.has(kind) || this.pending(kind).length === 0) continue;
      const gen = this.generation;
      void this.engine(kind).then(
        (engine) => {
          if (gen !== this.generation) return;
          if (kind === "math") this.hydrateMath(engine as EngineTypes["math"]);
          else if (kind === "echarts")
            this.hydrateEcharts(engine as EngineTypes["echarts"], dark);
          else this.hydrateMermaid(engine as EngineTypes["mermaid"], dark, gen);
        },
        (err) => {
          if (gen === this.generation) this.fallbackAll(kind, err);
        },
      );
    }
  }

  private engine<K extends EngineKind>(kind: K): Promise<unknown> {
    let p = this.resolved.get(kind);
    if (!p) {
      p = resolveEngine(kind, this.engines[kind] as never);
      this.resolved.set(kind, p);
    }
    return p;
  }

  /** 卸掉已不在 DOM 中的 ECharts 实例（增量渲染替换节点后会残留） */
  private disposeDetached(): void {
    if (this.charts.size === 0) return;
    const alive = new Set<Chart>();
    for (const node of this.mount.querySelectorAll(".penna-echarts__canvas")) {
      const c = (node as ChartHost)._pennaChart;
      if (c) alive.add(c);
    }
    for (const c of [...this.charts]) {
      if (alive.has(c)) continue;
      c.dispose();
      this.charts.delete(c);
    }
  }

  private pending(kind: EngineKind): HTMLElement[] {
    const sel = {
      math: ".penna-math-latex[data-latex]",
      echarts: ".penna-echarts__img[data-echarts]",
      mermaid: ".penna-mermaid__img[data-mermaid]",
    }[kind];
    return [...this.mount.querySelectorAll<HTMLElement>(`${sel}:not([${H}])`)];
  }

  private hydrateMath(engine: EngineTypes["math"]): void {
    const doc = this.mount.ownerDocument;
    for (const el of this.pending("math")) {
      const latex = el.getAttribute("data-latex") ?? "";
      if (!latex) continue;
      const inline = el.getAttribute("data-inline") === "true";
      const key = `math|${inline}|${latex}`;
      let html = this.cache.get(key);
      if (html === undefined) {
        try {
          html = engine.renderToString(latex, {
            displayMode: !inline,
            throwOnError: false,
            trust: false,
          });
          lruSet(this.cache, key, html);
        } catch {
          this.fallback(doc, el, latex, "penna-math-latex");
          continue;
        }
      }
      const wrap = doc.createElement(inline ? "span" : "div");
      wrap.className = "penna-math-latex";
      wrap.setAttribute("data-latex", latex);
      wrap.setAttribute("data-inline", String(inline));
      wrap.setAttribute(H, "math");
      wrap.innerHTML = html;
      el.replaceWith(wrap);
    }
  }

  private hydrateEcharts(engine: EngineTypes["echarts"], dark: boolean): void {
    const doc = this.mount.ownerDocument;
    for (const el of this.pending("echarts")) {
      const payload = el.getAttribute("data-echarts") ?? "";
      const host = doc.createElement("div") as ChartHost;
      host.className = "penna-echarts__img penna-echarts__canvas";
      host.setAttribute("data-echarts", payload);
      host.setAttribute(H, "echarts");
      host.style.cssText = `width:100%;max-width:100%;height:${ECHARTS_HEIGHT}`;
      el.replaceWith(host);
      try {
        const chart = engine.init(host, dark ? "dark" : undefined);
        chart.setOption({
          ...parseEchartsJson(base64UrlDecode(payload).trim()),
          animation: false,
        });
        host._pennaChart = chart;
        this.charts.add(chart);
      } catch {
        this.fallback(
          doc,
          host,
          base64UrlDecode(payload),
          "penna-echarts__img",
        );
      }
    }
  }

  private hydrateMermaid(
    engine: EngineTypes["mermaid"],
    dark: boolean,
    gen: number,
  ): void {
    const doc = this.mount.ownerDocument;
    for (const el of this.pending("mermaid")) {
      const payload = el.getAttribute("data-mermaid") ?? "";
      const code = base64UrlDecode(payload).trim();
      if (!code) {
        el.setAttribute(H, "failed");
        continue;
      }
      el.setAttribute(H, "pending");
      this.mermaidQueue = this.mermaidQueue.then(async () => {
        if (gen !== this.generation || !el.isConnected) return;
        const key = `mermaid|${dark}|${code}`;
        let svg = this.cache.get(key);
        if (svg === undefined) {
          const id = `penna-mmd-${mermaidSeq++}`;
          try {
            engine.initialize?.({
              startOnLoad: false,
              securityLevel: "strict",
              theme: dark ? "dark" : "default",
            });
            svg = (await engine.render(id, code)).svg;
            lruSet(this.cache, key, svg);
          } catch {
            doc.getElementById(`d${id}`)?.remove();
            doc.getElementById(id)?.remove();
            if (gen === this.generation && el.isConnected) {
              this.fallback(doc, el, code, "penna-mermaid__img");
            }
            return;
          }
        }
        if (gen !== this.generation || !el.isConnected) return;
        const host = doc.createElement("div");
        host.className = "penna-mermaid__img penna-mermaid__svg";
        host.setAttribute("data-mermaid", payload);
        host.setAttribute(H, "mermaid");
        host.innerHTML = svg;
        el.replaceWith(host);
      });
    }
  }

  /** 渲染失败：以源码文本回退，标记 failed 避免重试 */
  private fallback(
    doc: Document,
    el: HTMLElement,
    source: string,
    cls: string,
  ): void {
    const pre = doc.createElement("pre");
    pre.className = `${cls} penna-graph-fallback`;
    pre.setAttribute(H, "failed");
    for (const a of [
      "data-latex",
      "data-inline",
      "data-echarts",
      "data-mermaid",
    ]) {
      const v = el.getAttribute(a);
      if (v !== null) pre.setAttribute(a, v);
    }
    pre.textContent = source;
    el.replaceWith(pre);
  }

  /** 引擎本身加载失败：该类占位全部回退为源码 */
  private fallbackAll(kind: EngineKind, _err: unknown): void {
    const doc = this.mount.ownerDocument;
    for (const el of this.pending(kind)) {
      const raw =
        kind === "math"
          ? (el.getAttribute("data-latex") ?? "")
          : base64UrlDecode(
              el.getAttribute(
                kind === "echarts" ? "data-echarts" : "data-mermaid",
              ) ?? "",
            );
      this.fallback(doc, el, raw, el.className.split(" ")[0] ?? "");
    }
  }
}
