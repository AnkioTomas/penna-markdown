import "./styles.scss";
import "../../_common/penna-demo.scss";
import "../../_common/layout.scss";

import {
  createDemoTheme,
  setupPreviewThemeAndAppearance,
} from "../../_common/theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";
import { requiredEl } from "../../_common/dom.js";
import fullText from "../../../docs/simple.md?raw";

const TICK_MS = 30;

const playBtn = requiredEl<HTMLButtonElement>("#play-btn");
const restartBtn = requiredEl<HTMLButtonElement>("#restart-btn");
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

function updateChrome(ms: number, partial: boolean, changed: number): void {
  const mode = partial ? `增量 · 改 ${changed} 块` : "全量";
  timingEl.textContent = `${ms.toFixed(1)} ms · ${mode}`;

  source.value = fullText.slice(0, cursor);
  const percent = fullText.length
    ? Math.round((cursor / fullText.length) * 100)
    : 0;
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${cursor} / ${fullText.length} 字符 (${percent}%)`;
}

function stop(): void {
  playing = false;
  window.clearInterval(timer);
  timer = 0;
  playBtn.textContent = cursor >= fullText.length ? "重新播放" : "播放";
}

/**
 * 只把新增 delta 作为末尾追加走增量：
 * 传准确的新前缀全文 + 描述“尾部追加”的行变更集，
 * 由 Renderer 复用编辑器的增量路径（hash 边界 parse + DOM reconcile）。
 */
function feed(): void {
  const oldPrefix = fullText.slice(0, cursor);
  const step = Math.max(1, Math.round(charsPerTick() * (0.5 + Math.random())));
  const next = Math.min(fullText.length, cursor + step);
  const newPrefix = fullText.slice(0, next);

  const oldCount = normalizeMarkdownLines(oldPrefix).length;
  const newCount = normalizeMarkdownLines(newPrefix).length;

  const start = performance.now();
  const result =
    oldCount === 0
      ? renderer.render(newPrefix)
      : renderer.render(newPrefix, [
          {
            fromA: oldCount,
            toA: oldCount,
            fromB: oldCount,
            toB: newCount,
            deletedLines: 0,
            insertedLines: Math.max(0, newCount - oldCount),
            isFullDocument: false,
          },
        ]);
  const ms = performance.now() - start;

  cursor = next;
  updateChrome(
    ms,
    result.partial ?? false,
    result.changedStartLines?.length ?? 0,
  );
  autoScroll();

  if (cursor >= fullText.length) stop();
}

function play(): void {
  if (cursor >= fullText.length) return;
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
  progressBar.style.width = "0%";
  progressText.textContent = `0 / ${fullText.length} 字符 (0%)`;
  timingEl.textContent = "— ms";
  play();
}

playBtn.addEventListener("click", () => (playing ? stop() : play()));
restartBtn.addEventListener("click", restart);

function boot(): void {
  setupPreviewThemeAndAppearance(kit, preview, {
    onThemeChange: () => renderer.render(fullText.slice(0, cursor)),
  });
  themeBtn.addEventListener("click", () => {
    theme.setLightDark(theme.getTheme().isDark ? "light" : "dark");
    themeBtn.textContent = theme.getTheme().isDark ? "白天模式" : "夜间模式";
  });
  themeBtn.textContent = theme.getTheme().isDark ? "白天模式" : "夜间模式";

  progressText.textContent = `0 / ${fullText.length} 字符 (0%)`;
  play();
}

boot();
