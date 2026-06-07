/**
 * Cherry Web API 渲染（与 cherry-markdown 一致）
 * - 数学：https://math.vercel.app
 * - 图表：https://echarts-api.vercel.app
 */

export const MATH_API_HOST = "https://math.vercel.app";
export const ECHARTS_API_HOST = "https://echarts-api.vercel.app";

export function prefersDarkScheme() {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** @param {string} src */
export function parseEchartsJson(src) {
  const trimmed = src.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      // 兼容 cherry 的非严格 JSON（对象字面量）
      return new Function(`return ${trimmed}`)();
    } catch {
      return {};
    }
  }
}

/** @param {string} content @param {{ apiHost?: string }} [options] */
export function renderMathBlock(content, { apiHost = MATH_API_HOST } = {}) {
  const latex = content.trim();
  const color = prefersDarkScheme() ? "white" : "black";
  const src = `${apiHost}/?from=${encodeURIComponent(latex)}&color=${color}`;
  return `<div class="Cherry-Math" data-type="mathBlock"><img class="Cherry-Math-Latex" alt="latex" src="${src}" /></div>`;
}

/** @param {string} content @param {{ apiHost?: string }} [options] */
export function renderEchartsBlock(content, { apiHost = ECHARTS_API_HOST } = {}) {
  const isDark = prefersDarkScheme();
  const data = {
    theme: isDark ? "dark" : "",
    width: 600,
    height: 400,
    options: parseEchartsJson(content),
  };
  const src = `${apiHost}?data=${encodeURIComponent(JSON.stringify(data))}`;
  return `<div data-type="echarts" class="cherry-echarts-block"><img class="echart-container" style="max-width: 100%" src="${src}" alt="" /></div>`;
}
