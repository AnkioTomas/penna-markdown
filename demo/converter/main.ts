import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { requiredEl } from "../dom.js";
import example from "../test.md?raw";

const transformer = new TransformerEngine();

const markdownInput = requiredEl<HTMLTextAreaElement>("#markdown");
const preview = requiredEl<HTMLElement>("#preview");
const resetBtn = requiredEl<HTMLButtonElement>("#reset-btn");
const timing = requiredEl<HTMLElement>("#timing");

markdownInput.value = example;

type ScrollLock = "markdown" | "preview" | null;

let scrollLock: ScrollLock = null;

function applyScrollRatio(from: HTMLElement, to: HTMLElement): void {
  const fromMax = from.scrollHeight - from.clientHeight;
  const toMax = to.scrollHeight - to.clientHeight;
  const ratio = fromMax > 0 ? from.scrollTop / fromMax : 0;
  to.scrollTop = ratio * Math.max(0, toMax);
}

function syncPreviewFromInput(): void {
  if (scrollLock === "preview") return;
  scrollLock = "markdown";
  applyScrollRatio(markdownInput, preview);
  scrollLock = null;
}

function syncInputFromPreview(): void {
  if (scrollLock === "markdown") return;
  scrollLock = "preview";
  applyScrollRatio(preview, markdownInput);
  scrollLock = null;
}

markdownInput.addEventListener("scroll", syncPreviewFromInput);
preview.addEventListener("scroll", syncInputFromPreview);

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

window.cherryConverterDemo = { transformer, renderNow };
