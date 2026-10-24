/**
 * Demo 通用：图表引擎模式（远程 API / 外部 JS 库），可热切换。
 * 本地模式下，页面已用 `<script>` 引入的 `window.katex / mermaid / echarts`
 * 走 `"global"`，其余走打包库的动态 import。
 */
import type { GraphEngines } from "@/renderer/graph/engines.js";

export type EngineMode = "remote" | "local";

const STORAGE_KEY = "penna-demo-engines";

export function readEngineMode(): EngineMode {
  const q = new URLSearchParams(location.search).get("engines");
  return (q ?? localStorage.getItem(STORAGE_KEY)) === "local"
    ? "local"
    : "remote";
}

function has(name: string): boolean {
  return Boolean((window as unknown as Record<string, unknown>)[name]);
}

/** 当前模式对应的 `engines`；remote 为 `undefined` */
export function demoEngines(
  mode: EngineMode = readEngineMode(),
): GraphEngines | undefined {
  if (mode === "remote") return undefined;
  return {
    math: has("katex")
      ? "global"
      : async () => {
          const [m] = await Promise.all([
            import("katex"),
            import("katex/dist/katex.min.css"),
          ]);
          return m.default;
        },
    mermaid: has("mermaid") ? "global" : () => import("mermaid"),
    echarts: has("echarts") ? "global" : () => import("echarts"),
  };
}

/**
 * 在页头插入「图表引擎」下拉；切换时调用 `apply`（通常是 `renderer.setEngines`）。
 */
export function mountEngineSwitch(
  apply: (engines: GraphEngines | undefined) => void,
): void {
  if (document.getElementById("demo-engine-select")) return;
  const label = document.createElement("label");
  label.className = "demo-engine-switch";
  label.append("图表引擎 ");
  const select = document.createElement("select");
  select.id = "demo-engine-select";
  select.setAttribute("aria-label", "图表引擎");
  select.innerHTML =
    '<option value="remote">远程 API</option><option value="local">外部 JS 库</option>';
  select.value = readEngineMode();
  select.addEventListener("change", () => {
    const mode: EngineMode = select.value === "local" ? "local" : "remote";
    localStorage.setItem(STORAGE_KEY, mode);
    apply(demoEngines(mode));
  });
  label.append(select);

  const host = document.querySelector(".header-controls, .header");
  if (host) {
    host.append(label);
  } else {
    label.style.cssText =
      "position:fixed;top:8px;right:12px;z-index:1000;font-size:13px";
    document.body.append(label);
  }
}
