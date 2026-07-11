import type { EventBus } from "@/core/event/EventBus";
import type { EditorView } from "@codemirror/view";
import type { AIRequestFn } from "./runAction";
import { runAIAction } from "./runAction";

export function createAICommandListener(
  eventBus: EventBus,
  aiRequest: AIRequestFn,
  getView: () => EditorView,
): () => void {
  return eventBus.on("editor:command", (payload) => {
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
