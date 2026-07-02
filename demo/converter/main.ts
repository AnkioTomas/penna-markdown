import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { isDark } from "@/transformer/utils/isDark.js";
import { requiredEl } from "../dom.js";
// @ts-ignore
import example from "../test.md?raw";

const transformer = new TransformerEngine();

const markdownInput = requiredEl<HTMLTextAreaElement>("#markdown");
const preview = requiredEl<HTMLElement>("#preview");
const previewWrap = requiredEl<HTMLElement>("#preview-wrap");
const resetBtn = requiredEl<HTMLButtonElement>("#reset-btn");
const themeBtn = requiredEl<HTMLButtonElement>("#theme-btn");
const timing = requiredEl<HTMLElement>("#timing");

const THEME_KEY = "cherry-converter-theme";

markdownInput.value = example;

function syncThemeButton(): void {
  const dark = isDark(preview);
  themeBtn.textContent = dark ? "白天模式" : "夜间模式";
  themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
}

function applyTheme(dark: boolean): void {
  previewWrap.classList.toggle("cherry-dark", dark);
  previewWrap.classList.toggle("cherry-theme-default", !dark);
  document.body.classList.toggle("demo-dark", dark);
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  syncThemeButton();
  renderNow();
}

function initTheme(): void {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === "dark");
}

themeBtn.addEventListener("click", () => {
  applyTheme(!isDark(preview));
});

initTheme();

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

let t = 0;
markdownInput.addEventListener("input", () => {
  window.clearTimeout(t);
  t = window.setTimeout(renderNow, 60);
});

resetBtn.addEventListener("click", () => {
  markdownInput.value = example;
  renderNow();
});

renderNow();
