import "./styles.scss";
import "../../_common/penna-demo.scss";
import "../../_common/layout.scss";

import {
  createDemoTheme,
  setupPreviewThemeAndAppearance,
} from "../../_common/theme.js";
import { Renderer } from "@/renderer/Renderer.js";
import { requiredEl } from "../../_common/dom.js";
import { TURNS } from "./data.js";

const TICK_MS = 26;

const shell = requiredEl<HTMLElement>("#chat-shell");
const scroll = requiredEl<HTMLElement>("#chat-scroll");
const messages = requiredEl<HTMLElement>("#messages");
const presets = requiredEl<HTMLElement>("#presets");
const composer = requiredEl<HTMLFormElement>("#composer");
const input = requiredEl<HTMLTextAreaElement>("#prompt");
const stopBtn = requiredEl<HTMLButtonElement>("#stop-btn");
const speedSelect = requiredEl<HTMLSelectElement>("#speed-select");
const timingEl = requiredEl<HTMLElement>("#timing");

const kit = createDemoTheme(shell);
const { theme, eventBus, log } = kit;

/** 正在流式输出的那一条回答 */
interface Stream {
  renderer: Renderer;
  row: HTMLElement;
  text: string;
  cursor: number;
  timer: number;
  appends: number;
  totalMs: number;
}

let stream: Stream | null = null;
let turnIndex = 0;

function charsPerTick(): number {
  return Number(speedSelect.value) || 8;
}

/** 用户已向上翻阅时不再抢滚动条 */
function isPinnedToBottom(): boolean {
  return scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 80;
}

function addRow(role: "user" | "assistant"): {
  row: HTMLElement;
  body: HTMLElement;
} {
  const row = document.createElement("div");
  row.className = `msg msg--${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "user" ? "我" : "AI";

  const body = document.createElement("div");
  body.className = "msg-body";

  row.append(avatar, body);
  messages.append(row);
  return { row, body };
}

function showStats(prefix: string): void {
  if (!stream) return;
  const avg = stream.totalMs / Math.max(1, stream.appends);
  timingEl.textContent = `${prefix} ${stream.cursor} 字符 · ${stream.appends} 次 append · 平均 ${avg.toFixed(1)} ms`;
}

/** 结束当前流：停表、去掉光标态、保留已渲染内容 */
function endStream(prefix: string): void {
  if (!stream) return;
  window.clearInterval(stream.timer);
  stream.row.removeAttribute("data-streaming");
  showStats(prefix);
  stream = null;
  stopBtn.disabled = true;
}

/**
 * 一次 tick 就是一次 `renderer.append(delta)`。
 * Renderer 内部据此构造尾部行变更，只重渲染受影响的块。
 */
function tick(): void {
  if (!stream) return;

  const pinned = isPinnedToBottom();
  const step = Math.max(
    1,
    Math.round(charsPerTick() * (0.4 + Math.random() * 1.2)),
  );
  const next = Math.min(stream.text.length, stream.cursor + step);
  const delta = stream.text.slice(stream.cursor, next);
  stream.cursor = next;

  const start = performance.now();
  stream.renderer.append(delta);
  stream.totalMs += performance.now() - start;
  stream.appends++;

  showStats("输出中 ·");
  if (pinned) scroll.scrollTop = scroll.scrollHeight;

  if (stream.cursor >= stream.text.length) endStream("完成 ·");
}

function ask(question: string, answer: string): void {
  endStream("中断 ·");

  addRow("user").body.textContent = question;

  const assistant = addRow("assistant");
  assistant.row.setAttribute("data-streaming", "");

  stream = {
    // 各条回答各自持有 Renderer，但共享 theme 与 eventBus：
    // 切换明暗时，历史消息里的图表也会跟着重绘。
    renderer: new Renderer({
      mount: assistant.body,
      theme,
      eventBus,
      logger: log,
    }),
    row: assistant.row,
    text: answer,
    cursor: 0,
    timer: window.setInterval(tick, TICK_MS),
    appends: 0,
    totalMs: 0,
  };

  stopBtn.disabled = false;
  scroll.scrollTop = scroll.scrollHeight;
}

function nextAnswer(): string {
  const turn = TURNS[turnIndex % TURNS.length]!;
  turnIndex++;
  return turn.answer;
}

function autoGrowInput(): void {
  input.style.height = "auto";
  input.style.height = `${Math.min(160, input.scrollHeight)}px`;
}

function buildPresets(): void {
  presets.replaceChildren(
    ...TURNS.map((turn) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset";
      btn.textContent = turn.question;
      btn.addEventListener("click", () => ask(turn.question, turn.answer));
      return btn;
    }),
  );
}

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = input.value.trim();
  if (!question) return;
  input.value = "";
  autoGrowInput();
  ask(question, nextAnswer());
});

input.addEventListener("input", autoGrowInput);
input.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  composer.requestSubmit();
});

stopBtn.addEventListener("click", () => endStream("已停止 ·"));

function boot(): void {
  setupPreviewThemeAndAppearance(kit, messages);
  buildPresets();

  const first = TURNS[0]!;
  turnIndex = 1;
  ask(first.question, first.answer);
}

boot();
