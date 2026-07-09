import { keymap } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { IDLE_STATE, aiStateField, setAIState } from "./aiState";

/** Esc 取消 AI 生成 */
export function createAIKeymap(): Extension {
  return keymap.of([
    {
      key: "Escape",
      run(view) {
        const ai = view.state.field(aiStateField);
        if (ai.phase === "generating") {
          view.dispatch({ effects: setAIState.of(IDLE_STATE) });
          return true;
        }
        return false;
      },
    },
  ]);
}
