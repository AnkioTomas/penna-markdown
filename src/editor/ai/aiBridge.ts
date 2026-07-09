import type { Theme } from "@/theme/Theme";
import type { EditorView } from "@codemirror/view";
import type { AIRequestFn } from "./runAction";
import { runAIAction } from "./runAction";

export function createAICommandListener(
  theme: Theme,
  aiRequest: AIRequestFn,
  getView: () => EditorView,
): () => void {
  return theme.on("editor:command", (payload) => {
    const { command, payload: data } = payload as {
      command: string;
      payload?: { action?: string; prompts?: string };
    };
    if (command !== "ai") return;
    const action = data?.action;
    if (!action) return;
    runAIAction(getView(), action, aiRequest, data?.prompts);
  });
}
