import type { EditorView } from "@codemirror/view";
import { registerBasicCommands } from "./basic.js";
import { registerExtendCommands, registerThemeCommand } from "./extends.js";
import { registerBadgeCommand, applyBadge } from "./badge.js";
import { registerHeadingCommands, applyHeading } from "./heading.js";
import { registerLinkCommand, insertLink } from "./link.js";
import { registerCommand, getCommand } from "./registry.js";
import { registerTableCommand, insertTable } from "./table.js";
import type { CommandContext, EditorCommand } from "./types.js";

registerBasicCommands(registerCommand);
registerExtendCommands(registerCommand);
registerThemeCommand(registerCommand);
registerHeadingCommands(registerCommand);
registerTableCommand(registerCommand);
registerLinkCommand(registerCommand);
registerBadgeCommand(registerCommand);

export { applyHeading, insertTable, insertLink, applyBadge };
export type * from "./types.js";

export function runCommand(
  view: EditorView,
  command: EditorCommand | string,
  payload?: unknown,
  ctx?: CommandContext,
): boolean | Promise<boolean> {
  const handler = getCommand(command);
  if (!handler) return false;
  view.focus();
  return handler(view, payload, ctx ?? {});
}
