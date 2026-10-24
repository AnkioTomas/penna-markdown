/**
 * @file 外部图表库（KaTeX / Mermaid / ECharts）的接入类型与解析
 * @module renderer/graph/engines
 *
 * 每个引擎可传：库实例、返回库（或 ES module）的加载函数、或 `"global"`
 * （读取 `window.katex / mermaid / echarts`，对应 `<script>` / CDN 引入）。
 * 未配置的引擎继续走远程 API 图片。
 */

export interface MathEngine {
  renderToString(
    tex: string,
    options?: {
      displayMode?: boolean;
      throwOnError?: boolean;
      trust?: boolean;
    },
  ): string;
}

export interface MermaidEngine {
  initialize?(config: Record<string, unknown>): void;
  render(id: string, text: string): Promise<{ svg: string }>;
}

export interface EchartsInstance {
  setOption(option: Record<string, unknown>): void;
  dispose(): void;
  resize?(): void;
}

export interface EchartsEngine {
  init(el: HTMLElement, theme?: string | object | null): EchartsInstance;
}

export type EngineKind = "math" | "mermaid" | "echarts";

export interface EngineTypes {
  math: MathEngine;
  mermaid: MermaidEngine;
  echarts: EchartsEngine;
}

/** 引擎来源：实例 | 加载函数（可返回 ES module） | `"global"` */
export type EngineSource<T> =
  T | "global" | (() => T | { default: T } | Promise<T | { default: T }>);

export interface GraphEngines {
  math?: EngineSource<MathEngine>;
  mermaid?: EngineSource<MermaidEngine>;
  echarts?: EngineSource<EchartsEngine>;
}

const GLOBAL_NAME: Record<EngineKind, string> = {
  math: "katex",
  mermaid: "mermaid",
  echarts: "echarts",
};

/** 判定库实例所必需的方法名；用于识别 `import()` 返回的 `{ default }` 包装 */
const SIGNATURE: Record<EngineKind, string> = {
  math: "renderToString",
  mermaid: "render",
  echarts: "init",
};

function unwrap<K extends EngineKind>(kind: K, mod: unknown): EngineTypes[K] {
  const sig = SIGNATURE[kind];
  let cur = mod as Record<string, unknown> | undefined | null;
  if (cur && typeof cur[sig] !== "function" && cur.default) {
    cur = cur.default as Record<string, unknown>;
  }
  if (!cur || typeof cur[sig] !== "function") {
    throw new Error(`penna: invalid ${kind} engine (missing ${sig}())`);
  }
  return cur as unknown as EngineTypes[K];
}

/** 把任意来源解析成可用的库实例 */
export async function resolveEngine<K extends EngineKind>(
  kind: K,
  source: EngineSource<EngineTypes[K]>,
): Promise<EngineTypes[K]> {
  if (source === "global") {
    const g = (globalThis as Record<string, unknown>)[GLOBAL_NAME[kind]];
    if (!g) {
      throw new Error(`penna: window.${GLOBAL_NAME[kind]} is not defined`);
    }
    return unwrap(kind, g);
  }
  const value = typeof source === "function" ? await source() : source;
  return unwrap(kind, value);
}
