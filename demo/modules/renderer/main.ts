import "./styles.scss";
import "../../_common/cherry-demo.scss";
import "../../_common/layout.scss";

import { createDemoTheme } from "../../_common/theme.js";
import { Theme, THEME_EVENT_LIGHT_DARK, THEME_EVENT_SKIN } from "@/theme/Theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import { requiredEl } from "../../_common/dom.js";
import example from "../../../docs/test.md?raw";

const APPEARANCE_KEY = "cherry-renderer-demo-appearance";
const THEME_KEY = "cherry-renderer-demo-theme";
type AppearanceMode = "light" | "dark" | "auto";

function readAppearance(): AppearanceMode {
  const saved = localStorage.getItem(APPEARANCE_KEY);
  if (saved === "dark" || saved === "auto") return saved;
  return "light";
}

function resolveAppearance(mode: AppearanceMode): "light" | "dark" {
  if (mode === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
const resetBtn = requiredEl<HTMLButtonElement>("#reset-btn");

let appearance = readAppearance();
const theme = createDemoTheme();

function readThemeId(): string {
  const saved = localStorage.getItem(THEME_KEY);
  const available = theme.list();
  return saved && available.includes(saved as (typeof available)[number]) ? saved : "default";
}

theme.setTheme(readThemeId(), preview, previewWrap);

const renderer = new Renderer({
  mount: preview,
  theme,
});

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
  if (!theme.list().includes(next as ReturnType<Theme["list"]>[number])) return;
  theme.setTheme(next, preview, previewWrap);
  localStorage.setItem(THEME_KEY, next);
}

themeBtn.addEventListener("click", toggleAppearance);

themeSelect.addEventListener("change", () => {
  applyThemeId(themeSelect.value);
});

appearanceSelect.addEventListener("change", () => {
  applyAppearance(appearanceSelect.value as AppearanceMode);
});

resetBtn.addEventListener("click", () => {
  markdownInput.value = example;
  renderNow();
});

let debounceTimer = 0;
markdownInput.addEventListener("input", () => {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(renderNow, 80);
});

tocEl.addEventListener("click", (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>("a.toc-item");
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

function boot(): void {
  populateThemeSelect();
  markdownInput.value = example;
  theme.on(THEME_EVENT_LIGHT_DARK, onThemeChanged);
  theme.on(THEME_EVENT_SKIN, onThemeChanged);
  theme.setLightDark(resolveAppearance(appearance));
  renderNow();

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (appearance !== "auto") return;
    theme.setLightDark(resolveAppearance("auto"));
  });
}

boot();

window.cherryRendererDemo = {
  get theme() {
    return theme;
  },
  get renderer() {
    return renderer;
  },
  renderNow,
};
