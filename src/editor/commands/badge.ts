import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import type { BadgeDialogResult, CommandContext } from "./types.js";
import { insertText, wrapSelection } from "./utils.js";

function badgeSuffix(result: BadgeDialogResult): string {
  const parts: string[] = [result.variant];
  if (result.position && result.position !== "middle") parts.push(result.position);
  return `{.${parts.join(" ")}}`;
}

export async function applyBadge(
  view: EditorView,
  ctx?: CommandContext,
  payload?: unknown,
): Promise<boolean> {
  const { empty } = view.state.selection.main;
  if (!empty) {
    const variant = (payload as { variant?: string } | undefined)?.variant ?? "note";
    wrapSelection(view, "[", `]{.${variant}}`);
    return true;
  }
  if (!ctx?.theme) return false;
  const data = await requestDialog(ctx.theme, "badge");
  if (!data?.text) return false;
  insertText(view, `[${data.text}]${badgeSuffix(data)}`, 1, 1 + data.text.length);
  return true;
}

export function registerBadgeCommand(
  register: (name: string, handler: import("./types.js").CommandHandler) => void,
): void {
  register("badge", (view, payload, ctx) => applyBadge(view, ctx, payload));
}
