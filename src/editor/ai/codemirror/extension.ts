import {
  EditorState,
  StateEffect,
  StateField,
  type Transaction,
} from "@codemirror/state";
import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { DiffHunk } from "../diff";
import { hasPendingHunks } from "../diff";

export type AIState =
  | { phase: "idle" }
  | {
      phase: "generating";
      from: number;
      to: number;
      original: string;
      genId: number;
      action: string;
      prompts?: string;
    }
  | {
      phase: "diff";
      hunks: DiffHunk[];
    };

export const IDLE_STATE: AIState = { phase: "idle" };

export const setAIState = StateEffect.define<AIState>();

export const aiTransaction = StateEffect.define<null>();

/** 解析事务完成后的 AI 状态。 */
export function resolveAIState(tr: Transaction): AIState {
  let state = tr.startState.field(aiStateField);
  for (const effect of tr.effects) {
    if (effect.is(setAIState)) state = effect.value;
  }
  return state;
}

/** 判断事务是否由 AI 差异流程发起。 */
export function isAITransaction(tr: Transaction): boolean {
  return tr.effects.some((e) => e.is(aiTransaction));
}

/** 正在生成或仍有待确认差异块时锁定编辑 */
export function isAILocked(state: AIState): boolean {
  if (state.phase === "generating") return true;
  if (state.phase === "diff") return hasPendingHunks(state.hunks);
  return false;
}

export const aiStateField = StateField.define<AIState>({
  create() {
    return IDLE_STATE;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setAIState)) return effect.value;
    }
    return value;
  },
});

let nextGenId = 1;

/** 分配用于忽略过期 AI 请求结果的递增生成标识 */
export function allocGenId(): number {
  return nextGenId++;
}

export const aiLockedReadOnly = EditorState.readOnly.compute(
  [aiStateField],
  (state) => isAILocked(state.field(aiStateField)),
);

export const aiMaskPlugin = ViewPlugin.fromClass(
  class {
    mask: HTMLElement | null = null;

    constructor(readonly view: EditorView) {
      this.sync();
    }

    update(update: ViewUpdate) {
      const prev = update.startState.field(aiStateField);
      const curr = update.state.field(aiStateField);
      if (prev !== curr) this.sync();
    }

    sync() {
      const generating =
        this.view.state.field(aiStateField).phase === "generating";

      if (generating && !this.mask) {
        const mask = document.createElement("div");
        mask.className = "cherry-ai-mask";
        mask.setAttribute("aria-busy", "true");
        const spinner = document.createElement("div");
        spinner.className = "cherry-ai-mask-spinner";
        mask.appendChild(spinner);
        this.view.dom.appendChild(mask);
        this.mask = mask;
      } else if (!generating && this.mask) {
        this.mask.remove();
        this.mask = null;
      }
    }

    destroy() {
      this.mask?.remove();
      this.mask = null;
    }
  },
);
