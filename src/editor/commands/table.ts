import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import type { CommandContext } from "./types.js";
import { insertText } from "./utils.js";

export function buildTableMarkdown(rows: number, cols: number): string {
  const safeRows = Math.max(2, rows);
  const safeCols = Math.max(1, cols);
  const cell = () => "| " + Array(safeCols).fill(" ").join(" | ") + " |";
  const sep = () => "| " + Array(safeCols).fill("---").join(" | ") + " |";
  const lines = [cell(), sep()];
  for (let r = 2; r < safeRows; r++) lines.push(cell());
  return lines.join("\n") + "\n";
}

export async function insertTable(
  view: EditorView,
  ctx?: CommandContext,
): Promise<boolean> {
  if (!ctx?.theme) return false;
  const data = await requestDialog(ctx.theme, "table");
  if (!data) return false;
  const rows = Math.max(1, Math.min(10, data.rows));
  const cols = Math.max(1, Math.min(10, data.cols));
  const text = buildTableMarkdown(rows, cols);
  insertText(view, text, 2, 2);
  return true;
}

export function registerTableCommand(
  register: (
    name: string,
    handler: import("./types.js").CommandHandler,
  ) => void,
): void {
  register("table", (view, _payload, ctx) => insertTable(view, ctx));
}
