import type { EditorView } from "@codemirror/view";
import { setLinePrefix } from "./utils.js";

export function applyHeading(view: EditorView, level: number): boolean {
  if (level < 1 || level > 6) return false;
  return setLinePrefix(view, "#".repeat(level) + " ");
}

export function registerHeadingCommands(
  register: (
    name: string,
    handler: import("./types.js").CommandHandler,
  ) => void,
): void {
  for (let level = 1; level <= 6; level++) {
    const n = level;
    register(`heading${n}`, (view) => applyHeading(view, n));
  }
}
