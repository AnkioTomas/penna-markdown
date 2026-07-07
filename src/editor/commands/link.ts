import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import type { CommandContext } from "./types.js";
import { insertText } from "./utils.js";

function formatLink(text: string, url: string, title?: string): string {
  if (title) return `[${text}](${url} "${title}")`;
  return `[${text}](${url})`;
}

export async function insertLink(
  view: EditorView,
  ctx?: CommandContext,
): Promise<boolean> {
  if (!ctx?.theme) return false;
  const { from, to, empty } = view.state.selection.main;
  const selected = empty ? "" : view.state.sliceDoc(from, to);
  const data = await requestDialog(ctx.theme, "link", {
    text: selected,
    url: selected,
  });
  if (!data?.url) return false;
  const text = data.text || data.url;
  insertText(view, formatLink(text, data.url, data.title));
  return true;
}

export function registerLinkCommand(
  register: (name: string, handler: import("./types.js").CommandHandler) => void,
): void {
  register("link", (view, _payload, ctx) => insertLink(view, ctx));
}
