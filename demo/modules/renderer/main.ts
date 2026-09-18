import "./styles.scss";
import "../../_common/penna-demo.scss";
import "../../_common/layout.scss";

import { createDemoTheme } from "../../_common/theme.js";
import {
  LOCAL_ENGINES_SAMPLE,
  loadLocalEngines,
} from "../../_common/localEngines.js";
import { THEME_EVENT_LIGHT_DARK } from "@/theme/event/ThemeLightDarkEvent.js";
import { THEME_EVENT_SKIN } from "@/theme/event/ThemeSkinEvent.js";
import type { Theme } from "@/theme/Theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import type { GraphEngines } from "@/renderer/graph/graph.js";
import { requiredEl } from "../../_common/dom.js";
import example from "../../../docs/test.md?raw";

const APPEARANCE_KEY = "penna-renderer-demo-appearance";
const THEME_KEY = "penna-renderer-demo-theme";
const ENGINE_KEY = "penna-renderer-demo-engines";
type AppearanceMode = "light" | "dark" | "auto";
type EngineMode = "remote" | "local";

function readAppearance(): AppearanceMode {
  const saved = localStorage.getItem(APPEARANCE_KEY);
  if (saved === "dark" || saved === "auto") return saved;
  return "light";
}

function readEngineMode(): EngineMode {
  return localStorage.getItem(ENGINE_KEY) === "local" ? "local" : "remote";
}

function resolveAppearance(mode: AppearanceMode): "light" | "dark" {
  if (mode === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

const markdownInput = requiredEl<HTMLTextAreaElement>("#markdown");
const preview = requiredEl<HTMLElement>("#preview");
const previewWrap = requiredEl<HTMLElement>("#preview-wrap");
const tocEl = requiredEl<HTMLElement>("#toc");
const statsEl = requiredEl<HTMLElement>("#stats");
const timingEl = requiredEl<HTMLElement>("#timing");
const themeBtn = requiredEl<HTMLButtonElement>("#theme-btn");
const themeSelect = requiredEl<HTMLSelectElement>("#theme-select");
const appearanceSelect = requiredEl<HTMLSelectElement>("#appearance-select");
const engineSelect = requiredEl<HTMLSelectElement>("#engine-select");
const resetBtn = requiredEl<HTMLButtonElement>("#reset-btn");

let appearance = readAppearance();
let engineMode = readEngineMode();
const kit = createDemoTheme(previewWrap);
const { theme, eventBus, log } = kit;

function readThemeId(): string {
  const saved = localStorage.getItem(THEME_KEY);
  const available = theme.list();
  return saved && available.includes(saved) ? saved : "default";
}

theme.setTheme(readThemeId());

let renderer = createRenderer(undefined);

function createRenderer(engines: GraphEngines | undefined): Renderer {
  return new Renderer({
    mount: preview,
    theme,
    eventBus,
    logger: log,
    engines,
  });
}

function defaultMarkdownFor(mode: EngineMode): string {
  return mode === "local" ? LOCAL_ENGINES_SAMPLE : example;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function populateThemeSelect(): void {
  themeSelect.replaceChildren(
    ...theme.list().map((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = id.charAt(0).toUpperCase() + id.slice(1);
      return option;
    }),
  );
}

function syncThemeSelect(): void {
  themeSelect.value = theme.getTheme().id;
}

function syncAppearanceSelect(): void {
  appearanceSelect.value = appearance;
}

function syncEngineSelect(): void {
  engineSelect.value = engineMode;
}

function syncThemeButton(): void {
  const snapshot = theme.getTheme();
  themeBtn.textContent = snapshot.isDark ? "白天模式" : "夜间模式";
  themeBtn.setAttribute("aria-pressed", snapshot.isDark ? "true" : "false");
}

function syncDemoChrome(): void {
  document.body.classList.toggle("demo-dark", theme.getTheme().isDark);
  syncThemeButton();
  syncAppearanceSelect();
  syncThemeSelect();
  syncEngineSelect();
}

function renderToc(): void {
  const flat = renderer.getTocFlat();
  if (flat.length === 0) {
    tocEl.innerHTML = '<p class="sidebar-empty">无标题</p>';
    return;
  }

  tocEl.innerHTML = flat
    .map(
      (item) =>
        `<a class="toc-item toc-h${item.level}" href="#${encodeURIComponent(item.id)}">${escapeHtml(item.text)}</a>`,
    )
    .join("");
}

function renderStats(blocks: number, htmlLength: number): void {
  const snapshot = theme.getTheme();
  statsEl.innerHTML = `
    <dl>
      <dt>图表引擎</dt><dd>${engineMode === "local" ? "本地 JS 库" : "远程 API"}</dd>
      <dt>主题</dt><dd>${escapeHtml(snapshot.id)}</dd>
      <dt>明暗</dt><dd>${appearance === "auto" ? `auto (${snapshot.mode})` : snapshot.mode}</dd>
      <dt>顶层块</dt><dd>${blocks}</dd>
      <dt>HTML 长度</dt><dd>${htmlLength.toLocaleString()} 字符</dd>
      <dt>TOC 项</dt><dd>${renderer.getTocFlat().length}</dd>
      <dt>isDark</dt><dd>${snapshot.isDark ? "true" : "false"}</dd>
    </dl>
  `;
}

function renderNow(): void {
  const md = markdownInput.value;
  const start = performance.now();

  try {
    const { html, ast } = renderer.render(md);
    timingEl.textContent = `${(performance.now() - start).toFixed(1)} ms`;
    renderStats(ast.children?.length ?? 0, html.length);
    renderToc();
    syncDemoChrome();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    preview.innerHTML = `<p class="renderer-error">渲染错误：${escapeHtml(message)}</p>`;
    timingEl.textContent = "— ms";
    statsEl.innerHTML = "";
    tocEl.innerHTML = "";
  }
}

function applyResolvedAppearance(): void {
  theme.setLightDark(resolveAppearance(appearance));
  localStorage.setItem(APPEARANCE_KEY, appearance);
}

function toggleAppearance(): void {
  appearance = theme.getTheme().isDark ? "light" : "dark";
  applyResolvedAppearance();
}

function applyAppearance(next: AppearanceMode): void {
  appearance = next;
  applyResolvedAppearance();
}

function applyThemeId(next: string): void {
  if (!theme.list().includes(next)) return;
  theme.setTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

async function applyEngineMode(next: EngineMode): Promise<void> {
  const prevDefault = defaultMarkdownFor(engineMode);
  const wasOnDefault = markdownInput.value.trim() === prevDefault.trim();
  const modeChanged = next !== engineMode;

  if (!modeChanged && next === "remote") {
    syncEngineSelect();
    return;
  }

  engineSelect.disabled = true;
  try {
    const engines = next === "local" ? await loadLocalEngines() : undefined;
    renderer.destroy();
    preview.replaceChildren();
    renderer = createRenderer(engines);
    engineMode = next;
    localStorage.setItem(ENGINE_KEY, next);

    if (modeChanged && wasOnDefault) {
      markdownInput.value = defaultMarkdownFor(next);
    }
    renderNow();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    preview.innerHTML = `<p class="renderer-error">加载本地引擎失败：${escapeHtml(message)}</p>`;
    engineMode = "remote";
    localStorage.setItem(ENGINE_KEY, "remote");
    renderer.destroy();
    preview.replaceChildren();
    renderer = createRenderer(undefined);
    renderNow();
  } finally {
    engineSelect.disabled = false;
    syncEngineSelect();
  }
}

themeBtn.addEventListener("click", toggleAppearance);

themeSelect.addEventListener("change", () => {
  applyThemeId(themeSelect.value);
});

appearanceSelect.addEventListener("change", () => {
  applyAppearance(appearanceSelect.value as AppearanceMode);
});

engineSelect.addEventListener("change", () => {
  void applyEngineMode(engineSelect.value as EngineMode);
});

resetBtn.addEventListener("click", () => {
  markdownInput.value = defaultMarkdownFor(engineMode);
  renderNow();
});

let debounceTimer = 0;
markdownInput.addEventListener("input", () => {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(renderNow, 80);
});

tocEl.addEventListener("click", (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>(
    "a.toc-item",
  );
  if (!link?.hash) return;
  const id = decodeURIComponent(link.hash.slice(1));
  const target = document.getElementById(id);
  if (!target || !preview.contains(target)) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
});

function onThemeChanged(): void {
  syncDemoChrome();
  renderNow();
}

async function boot(): Promise<void> {
  populateThemeSelect();
  eventBus.on(THEME_EVENT_LIGHT_DARK, onThemeChanged);
  eventBus.on(THEME_EVENT_SKIN, onThemeChanged);
  theme.setLightDark(resolveAppearance(appearance));
  markdownInput.value = defaultMarkdownFor(engineMode);
  syncEngineSelect();

  if (engineMode === "local") {
    // 启动时已是 local：仍需装载引擎并重建 Renderer
    await applyEngineMode("local");
  } else {
    renderNow();
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (appearance !== "auto") return;
      theme.setLightDark(resolveAppearance("auto"));
    });
}

void boot();

declare global {
  interface Window {
    pennaRendererDemo?: {
      get theme(): Theme;
      get renderer(): Renderer;
      get engineMode(): EngineMode;
      renderNow: typeof renderNow;
      applyEngineMode: typeof applyEngineMode;
    };
  }
}

window.pennaRendererDemo = {
  get theme() {
    return theme;
  },
  get renderer() {
    return renderer;
  },
  get engineMode() {
    return engineMode;
  },
  renderNow,
  applyEngineMode,
};
