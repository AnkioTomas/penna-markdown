import { StateEffect, StateField, type Transaction } from "@codemirror/state";

export type AIState =
  | { phase: "idle" }
  | { phase: "bubble"; from: number; to: number }
  | { phase: "custom"; from: number; to: number }
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
      from: number;
      to: number;
      original: string;
      result: string;
    };

export const IDLE_STATE: AIState = { phase: "idle" };

export const setAIState = StateEffect.define<AIState>();

/** 标记由 AI 扩展主动发起的事务，避免 diff 阶段误触发自动 Reject */
export const aiTransaction = StateEffect.define<null>();

export function isAITransaction(tr: Transaction): boolean {
  return tr.effects.some((e) => e.is(aiTransaction));
}

export const aiStateField = StateField.define<AIState>({
  create() {
    return IDLE_STATE;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setAIState)) return effect.value;
    }

    if (value.phase === "diff" && tr.docChanged && !isAITransaction(tr)) {
      return IDLE_STATE;
    }

    if (
      tr.selection &&
      value.phase !== "generating" &&
      value.phase !== "diff"
    ) {
      const sel = tr.state.selection.main;
      if (sel.empty) {
        return value.phase === "idle" ? value : IDLE_STATE;
      }
      if (
        (value.phase === "bubble" || value.phase === "custom") &&
        value.from === sel.from &&
        value.to === sel.to
      ) {
        return value;
      }
      return { phase: "bubble", from: sel.from, to: sel.to };
    }

    return value;
  },
});

let nextGenId = 1;

export function allocGenId(): number {
  return nextGenId++;
}
