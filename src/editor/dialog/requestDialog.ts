import type {
  BadgeDialogResult,
  LinkDialogResult,
  TableDialogResult,
  MediaDialogResult,
  EmojiDialogResult,
  AttrDialogResult,
  FootnoteDialogResult,
  CodeBlockDialogResult,
  FrontmatterDialogResult,
  CollapseDialogResult,
  TimelineDialogResult,
} from "@/editor/commands/types.js";

export type DialogResultMap = {
  table: TableDialogResult;
  link: LinkDialogResult;
  badge: BadgeDialogResult;
  media: MediaDialogResult;
  emoji: EmojiDialogResult;
  attr: AttrDialogResult;
  footnote: FootnoteDialogResult;
  codeBlock: CodeBlockDialogResult;
  frontmatter: FrontmatterDialogResult;
  collapse: CollapseDialogResult;
  timeline: TimelineDialogResult;
};

export type DialogType = keyof DialogResultMap;

let dialogCounter = 0;

export function requestDialog<T extends DialogType>(
  theme: import("@/theme/Theme").Theme,
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
