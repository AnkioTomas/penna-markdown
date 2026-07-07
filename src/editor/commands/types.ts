import type { EditorView } from "@codemirror/view";
import type { Theme } from "@/theme/Theme";

export type EditorCommand = string;

export interface CommandContext {
  theme?: Theme;
}

export type CommandHandler = (
  view: EditorView,
  payload: unknown,
  ctx: CommandContext,
) => boolean | Promise<boolean>;

export interface InsertTextPayload {
  text: string;
  selectFrom?: number;
  selectTo?: number;
}

export interface TableDialogResult {
  rows: number;
  cols: number;
}

export interface LinkDialogResult {
  text: string;
  url: string;
  title?: string;
}

export type BadgeVariant =
  | "note"
  | "tip"
  | "important"
  | "warning"
  | "caution"
  | "danger";

export type BadgePosition = "middle" | "top" | "bottom";

export interface BadgeDialogResult {
  text: string;
  variant: BadgeVariant;
  position?: BadgePosition;
}
