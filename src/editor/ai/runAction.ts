import type { EditorView } from "@codemirror/view";
import type { CherryAIOptions } from "@/editor/CherryOptions";
import { enterDiffPhase } from "./aiDiff";
import {
  allocGenId,
  aiStateField,
  isAILocked,
  setAIState,
  IDLE_STATE,
} from "./aiState";

export type AIRequestFn = CherryAIOptions["AIRequest"];

export function getAITargetRange(view: EditorView): {
  from: number;
  to: number;
  text: string;
} {
  const sel = view.state.selection.main;
  if (!sel.empty) {
    return {
      from: sel.from,
      to: sel.to,
      text: view.state.doc.sliceString(sel.from, sel.to),
    };
  }
  const doc = view.state.doc;
  return {
    from: 0,
    to: doc.length,
    text: doc.toString(),
  };
}

export function runAIAction(
  view: EditorView,
  action: string,
  aiRequest: AIRequestFn,
  prompts?: string,
  range?: { from: number; to: number; text: string },
) {
  const current = view.state.field(aiStateField);
  if (isAILocked(current)) return;

  const target = range ?? getAITargetRange(view);
  const { from, to, text } = target;
  if (
    !text &&
    action !== "summarize" &&
    action !== "keyPoints" &&
    action !== "custom"
  )
    return;

  const genId = allocGenId();
  view.dispatch({
    effects: setAIState.of({
      phase: "generating",
      from,
      to,
      original: text,
      genId,
      action,
      prompts,
    }),
  });

  aiRequest(action, text, prompts)
    .then((result) => {
      const state = view.state.field(aiStateField);
      if (state.phase !== "generating" || state.genId !== genId) return;
      enterDiffPhase(view, from, to, text, result);
    })
    .catch(() => {
      const state = view.state.field(aiStateField);
      if (state.phase !== "generating" || state.genId !== genId) return;
      view.dispatch({ effects: setAIState.of(IDLE_STATE) });
    });
}
