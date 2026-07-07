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
  "note" | "tip" | "important" | "warning" | "caution" | "danger";

export type BadgePosition = "middle" | "top" | "bottom";

export interface BadgeDialogResult {
  text: string;
  variant: BadgeVariant;
  position?: BadgePosition;
}

export interface MediaDialogResult {
  kind: "video" | "audio" | "iframe";
  label: string;
  url: string;
  poster?: string;
}

export interface EmojiDialogResult {
  code: string;
}

export interface AttrDialogResult {
  attr: string;
}

export interface FootnoteDialogResult {
  id: string;
  content?: string;
  mode: "ref" | "def" | "both";
}

export type CodeBlockVariant = "basic" | "title" | "highlight" | "collapse";

export interface CodeBlockDialogResult {
  variant: CodeBlockVariant;
  lang: string;
  code: string;
  title?: string;
  highlightLines?: string;
}

export interface FrontmatterDialogResult {
  yaml: string;
}

export interface CollapseDialogResult {
  title: string;
  content: string;
  accordion: boolean;
  expanded: boolean;
}

export interface TimelineDialogResult {
  title: string;
  time: string;
  type: string;
  lineStyle: string;
  content: string;
}

export interface ContainerDialogResult {
  type: string;
  title: string;
  body: string;
}
