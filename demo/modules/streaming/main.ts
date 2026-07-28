import "./styles.scss";
import "../../_common/penna-demo.scss";
import "../../_common/layout.scss";

import {
  createDemoTheme,
  setupPreviewThemeAndAppearance,
} from "../../_common/theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import { requiredEl } from "../../_common/dom.js";
import simpleDoc from "../../../docs/simple.md?raw";
import fullDoc from "../../../docs/test.md?raw";

const TICK_MS = 30;

const DOCS: Record<string, string> = {
  simple: simpleDoc,
  full: fullDoc,
};

const playBtn = requiredEl<HTMLButtonElement>("#play-btn");
const restartBtn = requiredEl<HTMLButtonElement>("#restart-btn");
const docSelect = requiredEl<HTMLSelectElement>("#doc-select");
const speedSelect = requiredEl<HTMLSelectElement>("#speed-select");
const themeBtn = requiredEl<HTMLButtonElement>("#theme-btn");
const timingEl = requiredEl<HTMLElement>("#timing");
const progressBar = requiredEl<HTMLElement>("#progress-bar");
const progressText = requiredEl<HTMLElement>("#progress-text");
const source = requiredEl<HTMLTextAreaElement>("#source");
const preview = requiredEl<HTMLElement>("#preview");
const previewWrap = requiredEl<HTMLElement>("#preview-wrap");

const kit = createDemoTheme(previewWrap);
const { theme, eventBus, log } = kit;
const renderer = new Renderer({ mount: preview, theme, eventBus, logger: log });

let doc = DOCS[docSelect.value] ?? simpleDoc;
let cursor = 0;
let timer = 0;
let playing = false;

function charsPerTick(): number {
  return Number(speedSelect.value) || 20;
}

function autoScroll(): void {
  previewWrap.scrollTop = previewWrap.scrollHeight;
  source.scrollTop = source.scrollHeight;
}

function updateProgress(): void {
  const percent = doc.length ? Math.round((cursor / doc.length) * 100) : 0;
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${cursor} / ${doc.length} 字符 (${percent}%)`;
}

function stop(): void {
  playing = false;
  window.clearInterval(timer);
  timer = 0;
  playBtn.textContent = cursor >= doc.length ? "重新播放" : "播放";
}

/**
 * 只把新增 delta 交给 `renderer.append()`：
 * 由 Renderer 构造“尾部追加”的行变更，复用编辑器的增量路径
 * （hash 边界 parse + DOM reconcile），与真实 AI 流式调用完全一致。
 */
function feed(): void {
  const step = Math.max(1, Math.round(charsPerTick() * (0.5 + Math.random())));
  const next = Math.min(doc.length, cursor + step);
  const delta = doc.slice(cursor, next);

  const start = performance.now();
  const result = renderer.append(delta);
  const ms = performance.now() - start;

  cursor = next;
  source.value += delta;

  const mode = result.partial
    ? `增量 · 改 ${result.changedStartLines?.length ?? 0} 块`
    : "全量";
  timingEl.textContent = `${ms.toFixed(1)} ms · ${mode}`;
  updateProgress();
  autoScroll();

  if (cursor >= doc.length) stop();
}

function play(): void {
  if (cursor >= doc.length) return;
  playing = true;
  playBtn.textContent = "暂停";
  window.clearInterval(timer);
  timer = window.setInterval(feed, TICK_MS);
}

function restart(): void {
  window.clearInterval(timer);
  cursor = 0;
  renderer.render("");
  source.value = "";
  timingEl.textContent = "— ms";
  updateProgress();
  play();
}

playBtn.addEventListener("click", () => (playing ? stop() : play()));
restartBtn.addEventListener("click", restart);
docSelect.addEventListener("change", () => {
  doc = DOCS[docSelect.value] ?? simpleDoc;
  restart();
});

function boot(): void {
  setupPreviewThemeAndAppearance(kit, preview, {
    // 主题变化后整篇重渲染；随后 append 以此为基准继续流式追加。
    onThemeChange: () => renderer.render(doc.slice(0, cursor)),
  });
  themeBtn.addEventListener("click", () => {
    theme.setLightDark(theme.getTheme().isDark ? "light" : "dark");
    themeBtn.textContent = theme.getTheme().isDark ? "白天模式" : "夜间模式";
  });
  themeBtn.textContent = theme.getTheme().isDark ? "白天模式" : "夜间模式";

  updateProgress();
  play();
}

boot();
