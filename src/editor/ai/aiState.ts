import { StateEffect, StateField, type Transaction } from "@codemirror/state";
import type { DiffHunk } from "./diffLines";
import { hasPendingHunks } from "./diffLines";

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

export function isAITransaction(tr: Transaction): boolean {
  return tr.effects.some((e) => e.is(aiTransaction));
}

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

export function allocGenId(): number {
  return nextGenId++;
}
