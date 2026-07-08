import type { Theme } from "@/theme/Theme";
import type {
  DialogResultMap,
  DialogType,
} from "@/editor/commands/dialogTypes.js";

export type {
  DialogType,
  DialogResultMap,
} from "@/editor/commands/dialogTypes.js";

let dialogCounter = 0;

export function requestDialog<T extends DialogType>(
  theme: Theme,
  type: T,
  props?: Record<string, unknown>,
): Promise<DialogResultMap[T] | null> {
  const id = `dlg-${++dialogCounter}-${Date.now()}`;
  return new Promise((resolve) => {
    const off = theme.on("editor:dialog:result", (payload) => {
      const p = payload as {
        id: string;
        cancelled?: boolean;
        data?: DialogResultMap[T];
      };
      if (p.id !== id) return;
      off();
      resolve(p.cancelled ? null : (p.data ?? null));
    });
    theme.emit("editor:dialog:open", { id, type, props });
  });
}
