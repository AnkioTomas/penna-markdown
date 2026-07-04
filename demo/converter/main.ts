import { createDemoTheme } from "../theme.js";
import { THEME_EVENT_LIGHT_DARK } from "@/theme/Theme.js";
import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { requiredEl } from "../dom.js";
// @ts-ignore
import example from "../test.md?raw";

const THEME_KEY = "cherry-converter-theme";

const theme = createDemoTheme();
const markdownInput = requiredEl<HTMLTextAreaElement>("#markdown");
const preview = requiredEl<HTMLElement>("#preview");
const previewWrap = requiredEl<HTMLElement>("#preview-wrap");
const resetBtn = requiredEl<HTMLButtonElement>("#reset-btn");
const themeBtn = requiredEl<HTMLButtonElement>("#theme-btn");
const timing = requiredEl<HTMLElement>("#timing");

theme.setTheme("default", preview, previewWrap);

const savedAppearance = localStorage.getItem(THEME_KEY);
const transformer = new TransformerEngine({
  isDark: savedAppearance === "dark",
});

markdownInput.value = example;

function syncThemeButton(isDark: boolean): void {
  themeBtn.textContent = isDark ? "白天模式" : "夜间模式";
  themeBtn.setAttribute("aria-pressed", String(isDark));
}

function syncDemoChrome(isDark: boolean): void {
  document.body.classList.toggle("demo-dark", isDark);
  syncThemeButton(isDark);
}

function renderNow(): void {
  const md = markdownInput.value;
  const start = performance.now();

  try {
    preview.innerHTML = transformer.render(transformer.parse(md));
    timing.textContent = `${(performance.now() - start).toFixed(2)} ms`;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    preview.innerHTML = `<p class="converter-error">解析错误：${message}</p>`;
    timing.textContent = "— ms";
  }

  syncPreviewFromInput();
}

function applyThemeState(isDark: boolean): void {
  transformer.isDark = isDark;
  syncDemoChrome(isDark);
  renderNow();
}

theme.on(THEME_EVENT_LIGHT_DARK, ({ isDark }) => {
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  applyThemeState(isDark);
});

themeBtn.addEventListener("click", () => {
  const nextDark = !theme.getTheme().isDark;
  theme.setLightDark(nextDark ? "dark" : "light");
});

type ScrollLock = "markdown" | "preview" | null;

let scrollLock: ScrollLock = null;
let suppressScrollSync = 0;

function isInsideTabs(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(".cherry-tabs") !== null;
}

function pauseScrollSync(): void {
  suppressScrollSync += 1;
  window.setTimeout(() => {
    suppressScrollSync -= 1;
  }, 100);
}

function applyScrollRatio(from: HTMLElement, to: HTMLElement): void {
  const fromMax = from.scrollHeight - from.clientHeight;
  const toMax = to.scrollHeight - to.clientHeight;
  const ratio = fromMax > 0 ? from.scrollTop / fromMax : 0;
  to.scrollTop = ratio * Math.max(0, toMax);
}

function syncPreviewFromInput(): void {
  if (scrollLock === "preview" || suppressScrollSync > 0) return;
  scrollLock = "markdown";
  applyScrollRatio(markdownInput, previewWrap);
  scrollLock = null;
}

function syncInputFromPreview(): void {
  if (scrollLock === "markdown" || suppressScrollSync > 0) return;
  scrollLock = "preview";
  applyScrollRatio(previewWrap, markdownInput);
  scrollLock = null;
}

preview.addEventListener("mousedown", (e) => {
  if (!isInsideTabs(e.target)) return;

  const label = (e.target as Element).closest(".cherry-tabs__label");
  if (!label) return;

  e.preventDefault();
  pauseScrollSync();

  const radio = label.querySelector<HTMLInputElement>(".cherry-tabs__radio");
  if (radio) radio.checked = true;
});

markdownInput.addEventListener("scroll", syncPreviewFromInput);
previewWrap.addEventListener("scroll", syncInputFromPreview);

let t = 0;
markdownInput.addEventListener("input", () => {
  window.clearTimeout(t);
  t = window.setTimeout(renderNow, 60);
});

resetBtn.addEventListener("click", () => {
  markdownInput.value = example;
  renderNow();
});

const initialDark = savedAppearance === "dark";
const modeBeforeBoot = theme.getTheme().mode;
theme.setLightDark(initialDark ? "dark" : "light");
if (modeBeforeBoot === theme.getTheme().mode) {
  applyThemeState(theme.getTheme().isDark);
}
